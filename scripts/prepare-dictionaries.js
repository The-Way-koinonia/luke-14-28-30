const fs = require('fs');
const path = require('path');

function convertJsToJson(inputPath, outputPath) {
  console.log(`Converting ${inputPath}...`);
  try {
    const content = fs.readFileSync(inputPath, 'utf8');
    
    // Find the start and end of the JSON object
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Could not find JSON object brackets {}");
    }

    // Extract just the JSON part
    const jsonString = content.substring(startIndex, endIndex + 1);

    // Verify validity
    JSON.parse(jsonString);
    
    fs.writeFileSync(outputPath, jsonString);
    console.log(`✅ Created ${outputPath}`);
  } catch (e) {
    console.error(`❌ Failed to convert ${inputPath}:`, e.message);
    process.exit(1);
  }
}

const greekInput = process.argv[2];
const hebrewInput = process.argv[3];

if (!greekInput || !hebrewInput) {
    console.error("Usage: node prepare-dictionaries.js <greek-file> <hebrew-file>");
    process.exit(1);
}

// Convert Greek
const greekOutput = path.join(path.dirname(greekInput), 'strongs-greek-dictionary.json');
convertJsToJson(greekInput, greekOutput);

// Convert Hebrew
const hebrewOutput = path.join(path.dirname(hebrewInput), 'strongs-hebrew-dictionary.json');
convertJsToJson(hebrewInput, hebrewOutput);
