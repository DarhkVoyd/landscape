const yaml = require("js-yaml");
const path = require("path");
const fs = require("fs");
const url = require("url");

const landscapeFilePath = "landscape.yml";
const toolingFilePath = "external_data/tooling-data.yaml";

const landscapeData = loadYaml(landscapeFilePath);
const toolingData = loadYaml(toolingFilePath);

const toolsCategory = landscapeData.categories
  .filter((category) => category.name === "Tools")[0]
  .subcategories.filter((subcategory) => subcategory.name === "Tools")[0];

if (toolsCategory) {
  let tools = [];

  for (let tool of toolingData) {
    const name = tool.name;
    const homepage_url = tool.source || tool.homepage;
    const description = tool.description;

    if (name && homepage_url && description) {
      tools.push({
        name,
        homepage_url,
        description,
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

      tool.name = `@${domainOrUsername}/${tool.name}`;
    }
  });

  toolsCategory.items = tools.map((tool) => {
    const logoFileName = `${tool.name.replace(/ /g, "-").replace(/\//g, "-")}.svg`;
    const logoFilePath = path.join("logos", logoFileName);
    if (!fs.existsSync(logoFilePath)) {
      generateSvg(tool.name, logoFilePath);
    }

    return {
      name: tool.name,
      homepage_url: tool.homepage_url,
      logo: logoFileName,
      description: tool.description,
    };
  });

  saveYaml(landscapeData, landscapeFilePath);
} else {
  console.error("Tools category or subcategory not found.");
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
