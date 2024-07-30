const yaml = require("js-yaml");
const fs = require("fs");

const landscapeFilePath = "landscape.yml";
const toolingFilePath = "external_data/tooling-data.yaml";

const landscapeData = loadYaml(landscapeFilePath);
const toolingData = loadYaml(toolingFilePath);

const toolsCategory = landscapeData.categories
  .filter((category) => category.name === "Tools")[0]
  .subcategories.filter((subcategory) => subcategory.name === "Tools")[0];

if (toolsCategory) {
  toolsCategory.items = [];

  for (let tool of toolingData) {
    const name = tool.name;
    const homepage_url = tool.source || tool.homepage;
    const description = tool.description;

    if (name && homepage_url && description) {
      toolsCategory.items.push({
        name,
        homepage_url,
        logo: "",
        description,
      });
    }
  }

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
    const yamlStr = yaml.dump(data, {
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

function makeNameUnique(existingNames, name) {
  let originalName = name;
  let suffix = 1;
  while (existingNames.has(name)) {
    name = `${originalName} (${suffix})`;
    suffix += 1;
  }
  existingNames.add(name);
  return name;
}
