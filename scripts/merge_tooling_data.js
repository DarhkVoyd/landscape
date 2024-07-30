const yaml = require("js-yaml");
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

  toolsCategory.items = tools.map((tool) => ({
    name: tool.name,
    homepage_url: tool.homepage_url,
    logo: "",
    description: tool.description,
  }));

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
