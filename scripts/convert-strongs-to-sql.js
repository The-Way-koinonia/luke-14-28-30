// scripts/convert-strongs-to-sql.js
const fs = require('fs');

// Load the JavaScript file
const greekData = require('../path/to/strongs/greek.js');

// Generate SQL
let sql = `-- Greek Strong's Dictionary\n`;
Object.entries(greekData.strongsGreekDictionary).forEach(([num, entry]) => {
  sql += `INSERT INTO strongs_greek (strongs_number, lemma, transliteration, pronunciation, definition, derivation) VALUES (
    '${num}',
    '${entry.lemma?.replace(/'/g, "''")}',
    '${entry.translit?.replace(/'/g, "''")}',
    '${entry.pronunciation?.replace(/'/g, "''")}',
    '${entry.definition?.replace(/'/g, "''")}',
    '${entry.derivation?.replace(/'/g, "''")}'
  );\n`;
});

fs.writeFileSync('data/sql/strongs-greek.sql', sql);