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
      generateSvg(tool.uniqueName, logoFilePath);
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

function generateSvg(name, filePath) {
  const size = 550; // Adjusted width and height to make it a square
  const maxNameLength = 10;

  if (name.length > maxNameLength) {
    name = name.slice(0, maxNameLength) + "...";
  }

  const svgContent = `
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#fff" />
    <text y="50%" font-size="64" text-anchor="middle" fill="#000" dy=".3em">${name}</text>
  </svg>`;

  fs.writeFileSync(filePath, svgContent, "utf8");
}

function toTitleCase(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
