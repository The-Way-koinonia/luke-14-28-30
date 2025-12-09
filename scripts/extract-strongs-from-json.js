// scripts/extract-strongs-from-json.js
const fs = require('fs');
const path = require('path');

function parseVerseText(text, bookId, chapter, verse) {
  const words = [];
  let position = 1;
  
  // Match: <w lemma="strong:G746">beginning</w>
  const regex = /<w lemma="strong:([GH]\d+)">([^<]+)<\/w>/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    words.push({
      bookId,
      chapter,
      verse,
      position: position++,
      text: match[2],
      strongs: match[1]
    });
  }
  
  return words;
}

// Process all JSON files
const jsonFiles = fs.readdirSync('./bible_databases/json');
// ... generate SQL inserts