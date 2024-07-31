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

    const logoFileName = `${tool.uniqueName.replace(/ /g, "-").replace(/\//g, "-").replace(/\|/g, "-")}.svg`;
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
    "Arial",
    "Verdana",
    "Tahoma",
    "Trebuchet MS",
    "Times New Roman",
    "Georgia",
    "Courier New",
    "Lucida Console",
    "Monospace",
  ];

  const colors = [
    "#1E88E5",
    "#D32F2F",
    "#7B1FA2",
    "#0288D1",
    "#388E3C",
    "#FBC02D",
    "#F57C00",
    "#1976D2",
    "#AFB42B",
    "#5D4037",
    "#0097A7",
    "#C2185B",
    "#303F9F",
    "#7B1FA2",
    "#F4511E",
    "#00796B",
    "#512DA8",
    "#1976D2",
    "#388E3C",
    "#FBC02D",
    "#F57C00",
    "#9E9E9E",
    "#BDBDBD",
  ];

  const size = 512;
  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
  const randomFont = () => fonts[Math.floor(Math.random() * fonts.length)];

  let textColor;
  let backgroundColor;
  do {
    textColor = randomColor();
    backgroundColor = randomColor();
  } while (textColor === backgroundColor);

  const originalName = name
    .split("/")
    .pop()
    .replace(/[-.,@]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const designType = Math.floor(Math.random() * 5);
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
        <text x="50%" y="50%" font-size="200" font-family="${randomFont()}" font-weight="bold" text-anchor="middle" alignment-baseline="middle" fill="${textColor}">${shortName}</text>
      </svg>`;
      break;

    case 1:
      const words = originalName.split(" ");
      const firstWord = words[0] || "";
      const secondWord = words[1] || "";
      svgContent = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="45%" font-size="${firstWord.length < 4 ? "200" : "140"}"  font-family="${randomFont()}" font-weight="bold" text-anchor="middle" alignment-baseline="middle" fill="${textColor}" dy="-.1em">${firstWord}</text>
        <text x="50%" y="55%" font-size="${secondWord.length < 4 ? "200" : "140"}" font-family="${randomFont()}" font-weight="bold" text-anchor="middle" alignment-baseline="middle" fill="${textColor}" dy=".9em">${secondWord}</text>
      </svg>`;
      break;

    case 2:
      const firstWordBrand = originalName.split(" ")[0] || "";
      svgContent = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" font-size="${firstWordBrand.length < 4 ? "200" : "140"}" font-family="${randomFont()}" font-weight="bold" alignment-baseline="middle" text-anchor="middle" fill="${textColor}">${firstWordBrand}</text>
      </svg>`;
      break;

    case 3:
      svgContent = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10%" y="30%" width="80%" height="5%" fill="${backgroundColor}" />
        <rect x="10%" y="65%" width="80%" height="5%" fill="${backgroundColor}" />
        <text x="50%" y="50%" font-size="96" font-family="${randomFont()}" font-weight="bold" text-anchor="middle" alignment-baseline="middle" fill="${textColor}">
          ${originalName.split()[0]}
        </text>
      </svg>`;
      break;

    case 4:
      const color = randomColor();
      const cornerSize = size * 0.2; // 20% of the SVG size
      svgContent = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Top-left corner triangle -->
        <polygon points="0,0 ${cornerSize},0 0,${cornerSize}" fill="${color}" />
        <!-- Top-right corner triangle -->
        <polygon points="${size},0 ${size - cornerSize},0 ${size},${cornerSize}" fill="${color}" />
        <!-- Bottom-left corner triangle -->
        <polygon points="0,${size} ${cornerSize},${size} 0,${size - cornerSize}" fill="${color}" />
        <!-- Bottom-right corner triangle -->
        <polygon points="${size},${size} ${size - cornerSize},${size} ${size},${size - cornerSize}" fill="${color}" />
        <!-- Centered text -->
        <text x="50%" y="50%" font-size="96" font-family="${randomFont()}" font-weight="bold" text-anchor="middle" alignment-baseline="middle" fill="${textColor}">
          ${originalName.split()[0]}
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
