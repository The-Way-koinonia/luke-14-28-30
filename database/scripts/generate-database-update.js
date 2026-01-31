// Usage: node database/scripts/generate-database-update.js --version 2 --description "Fix typo in G26"

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const versionIndex = args.indexOf('--version');
const descIndex = args.indexOf('--description');

if (versionIndex === -1) {
  console.error('Error: --version parameter required');
  process.exit(1);
}

const version = parseInt(args[versionIndex + 1], 10);
const description = descIndex !== -1 ? args[descIndex + 1] : `Update ${version}`;

// Create the update structure
const update = {
  latest_version: version, // Matching interface DatabaseUpdate
  description: description,
  changes: [
    // Add your changes here manually or programmatically
    // Example:
    // {
    //   table: "strongs_definitions",
    //   operation: "update",
    //   where: { strongs_number: "G26" },
    //   data: { definition: "Corrected definition text" }
    // }
  ]
};

// Limit size check (warn if > 100KB)
const jsonStr = JSON.stringify(update, null, 2);
const sizeBytes = Buffer.byteLength(jsonStr);
if (sizeBytes > 100 * 1024) {
  console.warn(`⚠️  Warning: Update file size (${(sizeBytes/1024).toFixed(2)}KB) exceeds recommended 100KB limit.`);
}

// Save to updates directory in apps/web/src/data/updates
// Path relative to this script: ../../apps/web/src/data/updates
const outputDir = path.join(__dirname, '../../apps/web/src/data/updates');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, `update-v${version}.json`);
fs.writeFileSync(outputPath, jsonStr);

console.log(`✅ Created update file: ${outputPath}`);
console.log(`   Version: ${version}`);
console.log(`   Size: ${sizeBytes} bytes`);
console.log('📝 Edit this file to add your database changes, then deploy to server');
