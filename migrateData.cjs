const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../frontend/src/data/servicesData.ts');
const tempJsPath = path.join(__dirname, 'tempServices.cjs');
const outputPath = path.join(__dirname, 'src/data/services.json');

let content = fs.readFileSync(inputPath, 'utf8');

// Find where the object starts
const startIndex = content.indexOf("export const servicesDetailData");
if (startIndex === -1) {
  console.error("Could not find export const servicesDetailData");
  process.exit(1);
}

// Extract everything from the object start
let objectContent = content.substring(startIndex);

// Remove the export and type annotation
objectContent = objectContent.replace(/export const servicesDetailData:\s*Record<string, ServiceDetailData>\s*=\s*/, 'module.exports = ');

// Remove any other exports at the bottom
const getServiceDataIndex = objectContent.indexOf('export const getServiceData');
if (getServiceDataIndex !== -1) {
  objectContent = objectContent.substring(0, getServiceDataIndex);
}

// Replace icons with strings
objectContent = objectContent.replace(/icon:\s*(Fa[a-zA-Z0-9_]+)/g, 'icon: "$1"');

// Write to temp file
fs.writeFileSync(tempJsPath, objectContent);

try {
  const data = require('./tempServices.cjs');
  
  // Create dir if not exists
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log('Successfully wrote services.json');
} catch (err) {
  console.error("Error requiring temp file:", err);
}
