const yaml = require("js-yaml");
const path = require("path");
const fs = require("fs");
const url = require("url");

const landscapeFilePath = "landscape.yml";
const toolingFilePath = "external_data/tooling-data.yaml";

const landscapeData = loadYaml(landscapeFilePath);
const toolingData = loadYaml(toolingFilePath);

let toolsCategory = landscapeData.categories.filter(
  (category) => category.name === "Tools",
)[0];

if (toolsCategory) {
  toolsCategory.subcategories = [];

  let tools = [];

  for (let tool of toolingData) {
    const name = tool.name;
    const homepage_url = tool.source || tool.homepage;
    const description = tool.description;
    const toolingTypes = tool.toolingTypes;

    if (name && homepage_url && description && Array.isArray(toolingTypes)) {
      toolingTypes.forEach((toolingType) => {
        tools.push({
          name,
          homepage_url,
          description,
          toolingType,
        });
      });
    }
  }

  let nameCount = {};
  tools.forEach((tool) => {
    if (!nameCount[tool.name]) {
      nameCount[tool.name] = 0;
    }
    nameCount[tool.name]++;
  });

  tools.forEach((tool) => {
    if (nameCount[tool.name] > 1) {
      const parsedUrl = url.parse(tool.homepage_url);
      let domainOrUsername;

      if (parsedUrl.host.includes("github.com")) {
        const pathParts = parsedUrl.path.split("/");
        domainOrUsername = pathParts[1]; // GitHub username
      } else {
        const hostParts = parsedUrl.host.split(".");
        domainOrUsername =
          hostParts.length > 2 ? hostParts[hostParts.length - 2] : hostParts[0];
      }

      let uniqueName = `@${domainOrUsername}/${tool.name}`;
      if (nameCount[uniqueName]) {
        uniqueName = `${uniqueName} | ${toTitleCase(tool.toolingType)}`;
      }

      tool.uniqueName = uniqueName;
      nameCount[uniqueName] = (nameCount[uniqueName] || 0) + 1;
    } else {
      tool.uniqueName = tool.name;
    }
  });

  tools.forEach((tool) => {
    let toolingTypeTitleCase = toTitleCase(tool.toolingType);
    let subcategory = toolsCategory.subcategories.find(
      (sub) => sub.name === toolingTypeTitleCase,
    );
    if (!subcategory) {
      subcategory = {
        name: toolingTypeTitleCase,
        items: [],
      };
      toolsCategory.subcategories.push(subcategory);
    }

    const logoFileName = `${tool.uniqueName.replace(/ /g, "-").replace(/\//g, "-").replace(/\|/g, "-").toLowerCase()}.svg`;
    const logoFilePath = path.join("logos", logoFileName);

    if (!fs.existsSync(logoFilePath)) {
      generateLogo(tool.uniqueName, logoFilePath, tool.toolingType);
    }

    subcategory.items.push({
      name: tool.uniqueName,
      homepage_url: tool.homepage_url,
      logo: logoFileName,
      description: tool.description,
    });
  });

  // Sort tools in each subcategory by name
  toolsCategory.subcategories.forEach((subcategory) => {
    subcategory.items.sort((a, b) => a.name.localeCompare(b.name));
  });

  saveYaml(landscapeData, landscapeFilePath);
} else {
  console.error("Tools category not found.");
}

function loadYaml(filePath) {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    return yaml.load(fileContents);
  } catch (e) {
    console.error(`Failed to load YAML file: ${filePath}`, e);
    return null;
  }
}

function saveYaml(data, filePath) {
  try {
    let yamlStr = yaml.dump(data, {
      sortKeys: false,
      noRefs: true,
      indent: 2,
      lineWidth: -1, // Ensures that long lines are not broken
    });

    fs.writeFileSync(filePath, yamlStr, "utf8");
  } catch (e) {
    console.error(`Failed to save YAML file: ${filePath}`, e);
  }
}

function generateLogo(name, filePath) {
  const fonts = [
    "Impact",
    // "Arial",
    // "Verdana",
    // "Times New Roman",
    // "Courier New",
    // "Lucida Console",
    // "Monospace",
  ];

  const textColors = [
    // "#000000", // Black
    // "#4169E1", // DodgerBlue
    "#2F4F4F", // DarkSlateGray
    // "#556983",
    // "#000080", // Navy
    // "#800000", // Maroon
    // "#00008B", // DarkBlue
    // "#191970", // MidnightBlue
    // "#0000CD", // MediumBlue
    // "#8B0000", // DarkRed
    // "#006400", // DarkGreen
    // "#556B2F", // DarkOliveGreen
    // "#B22222", // FireBrick
    // "#483D8B", // DarkSlateBlue
  ];

  const size = 512;

  const randomColor = (colors) =>
    colors[Math.floor(Math.random() * colors.length)];
  const randomFont = () => fonts[Math.floor(Math.random() * fonts.length)];
  const getTextColor = () => randomColor(textColors);
  function calculateFontSize(numLetters) {
    const minLetters = 4;
    const maxLetters = 18;
    const minSize = 32;
    const maxSize = 96;
    numLetters = Math.max(minLetters, Math.min(numLetters, maxLetters));
    const slope = (minSize - maxSize) / (maxLetters - minLetters);
    const fontSize = maxSize + slope * (numLetters - minLetters);

    return fontSize;
  }

  function truncateString(str, maxLength = 18) {
    if (str.length > maxLength) {
      return str.slice(0, maxLength);
    }
    return str;
  }

  const originalName = name
    .split("/")
    .pop()
    .replace(/[-@]/g, " ")
    .replace(/[()]/g, "")
    .replace(/::/g, " ")
    .replace(/, /g, " ")
    .replace(/([a-z]{2,})([A-Z][a-z])/g, "$1 $2")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .split(" |")[0];

  const designType = 1;
  const randomUppercase = Math.random() > 0.5;
  let textColor = getTextColor();
  let svgContent;

  switch (designType) {
    case 0:
      const shortName =
        originalName.length > 1
          ? originalName.slice(
              0,
              Math.min(Math.floor(Math.random() * 3) + 2, originalName.length),
            )
          : originalName;

      svgContent = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" font-size="200" font-family="${randomFont()}" font-weight="normal" text-anchor="middle" alignment-baseline="middle" fill="${textColor}">
          ${randomUppercase ? shortName.toUpperCase() : shortName}
        </text>
      </svg>`;
      break;

    case 1:
      const maxWords = 5;
      const font = randomFont();
      const words = originalName.split(" ");

      const validWords = words.slice(0, maxWords);
      const wordCount = validWords.length;
      const sectionHeight = 100 / (wordCount + 1);

      svgContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;

      validWords.forEach((word, i) => {
        if (word) {
          const fontSize = calculateFontSize(word.length);
          const yPosition = (i + 1) * sectionHeight; // Position evenly across sections
          svgContent += `
        <text x="50%" y="${yPosition}%" font-size="${fontSize}" font-family="${font}" font-weight="normal" text-anchor="middle" alignment-baseline="middle" fill="${textColor}">
          ${truncateString(word)}
        </text>`;
        }
      });

      svgContent += `</svg>`;
      break;

    case 2:
      const firstWordBrand = originalName.split(" ")[0] || "";
      svgContent = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" font-size="${calculateFontSize(firstWordBrand.length)}" font-family="${randomFont()}" font-weight="normal" alignment-baseline="middle" text-anchor="middle" fill="${textColor}">${truncateString(firstWordBrand)}</text>
      </svg>`;
      break;

    case 3:
      const firstPart = originalName.split(" ")[0];
      const truncatedName = truncateString(firstPart);
      const fontSize = calculateFontSize(truncatedName.length);
      svgContent = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10%" y="30%" width="80%" height="5%" fill="${textColor}" />
        <rect x="10%" y="65%" width="80%" height="5%" fill="${textColor}" />
        <text x="50%" y="50%" font-size="${fontSize}" font-family="${randomFont()}" font-weight="normal" text-anchor="middle" alignment-baseline="middle" fill="${textColor}" dy="0.1em">
          ${randomUppercase ? truncateString(firstPart.toUpperCase()) : truncateString(firstPart)}
        </text>
      </svg>`;
      break;
  }

  fs.writeFileSync(filePath, svgContent, "utf8");
}

function toTitleCase(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
