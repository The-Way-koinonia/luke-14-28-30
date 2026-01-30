
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Paths
const OUTPUT_DB = path.join(process.cwd(), 'apps/mobile/assets/bible.db');
const KJV_JSON = path.join(process.cwd(), 'apps/web/src/data/KJV_test.json');
const HEBREW_DICT = path.join(process.cwd(), 'strongs/hebrew/strongs-hebrew-dictionary.js');
const GREEK_DICT = path.join(process.cwd(), 'strongs/greek/strongs-greek-dictionary.js');

// Verify paths first
if (!fs.existsSync(KJV_JSON)) {
    console.error('❌ KJV JSON not found at:', KJV_JSON);
    process.exit(1);
}
if (!fs.existsSync(HEBREW_DICT)) {
    console.error('❌ Hebrew dict not found at:', HEBREW_DICT);
    process.exit(1);
}
if (!fs.existsSync(GREEK_DICT)) {
    console.error('❌ Greek dict not found at:', GREEK_DICT);
    process.exit(1);
}

// Ensure assets directory exists
const assetsDir = path.dirname(OUTPUT_DB);
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// remove existing db
if (fs.existsSync(OUTPUT_DB)) {
  fs.unlinkSync(OUTPUT_DB);
}

const db = new Database(OUTPUT_DB);

console.log('🏗️  Building Mobile Database...');

// 1. Create Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS bible_books (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    testament TEXT NOT NULL -- 'OT' or 'NT'
  );

  CREATE TABLE IF NOT EXISTS bible_verses (
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    PRIMARY KEY (book_id, chapter, verse),
    FOREIGN KEY (book_id) REFERENCES bible_books(id)
  );

  CREATE TABLE IF NOT EXISTS strongs_dictionary (
    id TEXT PRIMARY KEY, -- e.g. 'H1234', 'G543'
    lemma TEXT,
    translit TEXT,
    pron TEXT,
    derivation TEXT,
    strongs_def TEXT,
    kjv_def TEXT
  );
  
  CREATE VIRTUAL TABLE verses_fts USING fts5(text, content='bible_verses', content_rowid='rowid');
    
  -- Triggers to keep FTS index in sync (optional but good practice if we were modifying data, 
  -- here we just need to populate it once).
  -- For read-only DB build, we can just INSERT into it.
`);

// 2. Load Dictionary Data
function loadDictionary(filePath, prefix) {
  console.log(`Loading ${prefix === 'H' ? 'Hebrew' : 'Greek'} Dictionary...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  // Robust JSON extraction
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`Invalid dictionary file: ${filePath}`);
  
  const json = JSON.parse(content.substring(start, end + 1));
  const insert = db.prepare(`
    INSERT OR REPLACE INTO strongs_dictionary (id, lemma, translit, pron, derivation, strongs_def, kjv_def)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const [key, entry] of Object.entries(json)) {
      insert.run(
        key,
        entry.lemma || '',
        entry.xlit || entry.translit || '',
        entry.pron || '',
        entry.derivation || '',
        entry.strongs_def || '',
        entry.kjv_def || ''
      );
    }
  });
  transaction();
}

loadDictionary(HEBREW_DICT, 'H');
loadDictionary(GREEK_DICT, 'G');

// 3. Load Bible Verses
console.log('Loading KJV Verses...');
const kjvData = JSON.parse(fs.readFileSync(KJV_JSON, 'utf-8'));
const books = kjvData.books;

const insertBook = db.prepare('INSERT INTO bible_books (id, name, testament) VALUES (?, ?, ?)');
const insertVerse = db.prepare('INSERT INTO bible_verses (book_id, chapter, verse, text) VALUES (?, ?, ?, ?)');
const insertFts = db.prepare('INSERT INTO verses_fts (rowid, text) VALUES (?, ?)');

const transaction = db.transaction(() => {
  let bookIdCounter = 1;
  for (const book of books) {
    const bookId = bookIdCounter++;
    const testament = bookId <= 39 ? 'OT' : 'NT'; // Standard KJV order
    insertBook.run(bookId, book.name, testament);

    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        const info = insertVerse.run(bookId, verse.chapter, verse.verse, verse.text);
        // Populate FTS table using the rowid from the main table
        insertFts.run(info.lastInsertRowid, verse.text);
      }
    }
  }
});

transaction();

console.log('✅ Mobile Database Built Successfully!');
console.log(`   Location: ${OUTPUT_DB}`);
db.close();
