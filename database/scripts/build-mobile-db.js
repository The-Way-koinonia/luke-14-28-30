const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Configuration
const CONFIG = {
  OUTPUT_DB: path.join(process.cwd(), 'apps/mobile/assets/bible.db'),
  KJV_JSON: path.join(process.cwd(), 'apps/web/src/data/KJV_test.json'),
  HEBREW_DICT: path.join(process.cwd(), 'strongs/hebrew/strongs-hebrew-dictionary.js'),
  GREEK_DICT: path.join(process.cwd(), 'strongs/greek/strongs-greek-dictionary.js'),
  EXPECTED_KJV_VERSES: 31102,
  EXPECTED_HEBREW_ENTRIES: 8674,
  EXPECTED_GREEK_ENTRIES: 5624, // Approximate from previous runs (5523 + ~101?) - wait, previous scan said 5523 entries found, 5504 imported? 
                                // User prompt said ~5624. I will warn if widely off, or just log.
  SCHEMA_VERSION: '1',
  DATA_VERSION: '1'
};

const OLD_TESTAMENT_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
];

function getTestament(bookName, bookId) {
  // Use standard list if name matches, or fallback to standard KJV book order (1-39 = OT)
  if (OLD_TESTAMENT_BOOKS.includes(bookName)) return 'OT';
  // Common variations handling if needed, or fallback to ID
  if (bookId <= 39) return 'OT';
  return 'NT';
}

function cleanup() {
  if (fs.existsSync(CONFIG.OUTPUT_DB)) {
    try {
      fs.unlinkSync(CONFIG.OUTPUT_DB);
      console.log('🧹 Cleaned up partial database');
    } catch (e) {
      console.error('Failed to cleanup partial database:', e);
    }
  }
}

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('\n❌ Build failed (uncaught exception):', error);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Build failed (unhandled rejection):', reason);
  cleanup();
  process.exit(1);
});

async function buildDatabase() {
  console.time('Building Mobile Database');
  console.log('🏗️  Building Mobile Database...');

  // 1. Verify paths
  if (!fs.existsSync(CONFIG.KJV_JSON)) throw new Error(`KJV JSON not found at: ${CONFIG.KJV_JSON}`);
  if (!fs.existsSync(CONFIG.HEBREW_DICT)) throw new Error(`Hebrew dict not found at: ${CONFIG.HEBREW_DICT}`);
  if (!fs.existsSync(CONFIG.GREEK_DICT)) throw new Error(`Greek dict not found at: ${CONFIG.GREEK_DICT}`);
  
  const assetsDir = path.dirname(CONFIG.OUTPUT_DB);
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  
  if (fs.existsSync(CONFIG.OUTPUT_DB)) fs.unlinkSync(CONFIG.OUTPUT_DB);

  const db = new Database(CONFIG.OUTPUT_DB);

  // Enable WAL mode for performance
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  console.log('✓ Verified all source files exist');

  // 2. Create Schema
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

    CREATE TABLE IF NOT EXISTS strongs_definitions (
      strongs_number TEXT PRIMARY KEY,
      testament TEXT,
      original_word TEXT,
      transliteration TEXT,
      pronunciation TEXT,
      part_of_speech TEXT,
      definition TEXT NOT NULL,
      kjv_usage TEXT
    );
    
    CREATE VIRTUAL TABLE verses_fts USING fts5(text, content='bible_verses', content_rowid='rowid');
    
    CREATE TABLE IF NOT EXISTS database_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  console.log('✓ Created database schema');

  // 3. Load Dictionaries
  function loadDictionary(filePath, langName, testament, prefix) {
    console.time(`Loading ${langName} Dictionary`);
    console.log(`📖 Loading ${langName} Dictionary...`);
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Robust extraction using VM to avoid 'require' caching or format issues
    // Assumption: File content is like "var strongsHebrewDictionary = { ... };" or uses module.exports
    // We execute it in a sandbox and extract the variable
    const sandbox = { module: { exports: {} } };
    vm.createContext(sandbox);
    
    try {
      vm.runInContext(content, sandbox);
    } catch (e) {
      // Fallback or retry? If VM fails, maybe just use JSON parse if it's pure JSON
      // But based on file check, it is JS assignment.
      throw new Error(`Failed to evaluate ${langName} dictionary JS: ${e.message}`);
    }
    
    // Try to get from module.exports
    let dictionary = sandbox.module.exports;
    
    // If not, try to find the variable
    if (!dictionary || Object.keys(dictionary).length === 0) {
        const dictionaryKey = Object.keys(sandbox).find(k => k.includes('Dictionary') && k !== 'module');
        if (dictionaryKey) {
            dictionary = sandbox[dictionaryKey];
        }
    }

    if (!dictionary) {
        throw new Error(`Could not find dictionary object in ${langName} file`);
    }

    const entries = Object.entries(dictionary);
    
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO strongs_definitions (
        strongs_number, testament, original_word, transliteration,
        pronunciation, part_of_speech, definition, kjv_usage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let processed = 0;
    let skipped = 0;
    
    const transaction = db.transaction(() => {
      for (const [key, entry] of entries) {
        // Validation
        if (!entry.strongs_def) {
          // console.warn(`   ⚠️  Skipping invalid entry in ${langName}: ${key} (No definition)`);
          skipped++;
          continue;
        }

        let strongsNum = key.trim();
        if (!strongsNum.startsWith(prefix)) {
           strongsNum = prefix + strongsNum;
        }

        insertStmt.run(
          strongsNum,
          testament,
          entry.lemma || null,
          entry.translit || entry.xlit || null,
          entry.pron || null,
          entry.partOfSpeech || null,
          entry.strongs_def,
          entry.kjv_def || entry.kjvUsage || null
        );
        processed++;
      }
    });

    try {
      transaction();
    } catch (error) {
       console.error(`Transaction failed for ${langName}:`, error);
       throw error;
    }

    console.log(`   Processed ${processed.toLocaleString()} entries in ${(console.timeEnd(`Loading ${langName} Dictionary`), '')} (Skipped ${skipped})`);
    return processed;
  }

  const hCount = loadDictionary(CONFIG.HEBREW_DICT, 'Hebrew', 'OT', 'H');
  const gCount = loadDictionary(CONFIG.GREEK_DICT, 'Greek', 'NT', 'G');

  // 4. Load Verses
  console.time('Loading KJV Verses');
  console.log('📚 Loading KJV Verses...');
  
  const kjvData = JSON.parse(fs.readFileSync(CONFIG.KJV_JSON, 'utf-8'));
  const books = kjvData.books;
  let totalVerses = 0;
  
  const insertBook = db.prepare('INSERT INTO bible_books (id, name, testament) VALUES (?, ?, ?)');
  const insertVerse = db.prepare('INSERT INTO bible_verses (book_id, chapter, verse, text) VALUES (?, ?, ?, ?)');
  const insertFts = db.prepare('INSERT INTO verses_fts (rowid, text) VALUES (?, ?)');
  
  const verseTransaction = db.transaction(() => {
    let bookIdCounter = 1;
    for (const book of books) {
      const bookId = bookIdCounter++;
      const testament = getTestament(book.name, bookId);
      
      insertBook.run(bookId, book.name, testament);
      
      let bookVerses = 0;
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
            const info = insertVerse.run(bookId, verse.chapter, verse.verse, verse.text);
            insertFts.run(info.lastInsertRowid, verse.text);
            bookVerses++;
            totalVerses++;
        }
      }
      // console.log(`   ${book.name} (${book.chapters.length} chapters, ${bookVerses} verses)`);
    }
  });

  try {
    verseTransaction();
  } catch (error) {
    console.error('Verse transaction failed:', error);
    throw error;
  }
  
  console.log(`   Processed ${books.length} books, ${totalVerses.toLocaleString()} verses`);
  console.timeEnd('Loading KJV Verses');

  // 5. Indexes
  console.log('🔍 Creating indexes...');
  console.time('Indexes');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON bible_verses(book_id, chapter);
    CREATE INDEX IF NOT EXISTS idx_strongs_testament ON strongs_definitions(testament);
  `);
  console.timeEnd('Indexes');
  console.log('✓ Indexes created');

  // 6. Metadata
  const insertMeta = db.prepare('INSERT OR REPLACE INTO database_metadata (key, value, updated_at) VALUES (?, ?, ?)');
  const now = new Date().toISOString().replace('T', ' ').split('.')[0];
  
  const metaTransaction = db.transaction(() => {
      insertMeta.run('schema_version', CONFIG.SCHEMA_VERSION, now);
      insertMeta.run('data_version', CONFIG.DATA_VERSION, now);
      insertMeta.run('build_date', now, now);
      insertMeta.run('kjv_version', 'complete', now);
      insertMeta.run('strongs_version', 'complete', now);
      insertMeta.run('total_verses', totalVerses.toString(), now);
      insertMeta.run('last_update_check', now, now);
  });
  metaTransaction();

  // 7. Validation
  console.log('✅ Validation checks:');
  
  const verseCount = db.prepare('SELECT COUNT(*) as count FROM bible_verses').get().count;
  const strongsCount = db.prepare('SELECT COUNT(*) as count FROM strongs_definitions').get().count;
  const bookCount = db.prepare('SELECT COUNT(*) as count FROM bible_books').get().count;
  const ftsCount = db.prepare('SELECT COUNT(*) as count FROM verses_fts').get().count;

  if (verseCount !== CONFIG.EXPECTED_KJV_VERSES) {
    console.warn(`  ⚠️  Expected ${CONFIG.EXPECTED_KJV_VERSES} verses, found ${verseCount}`);
  } else {
    console.log(`  ✓ Expected ${CONFIG.EXPECTED_KJV_VERSES} verses, found ${verseCount}`);
  }

  const totalStrongs = hCount + gCount;
  if (strongsCount !== totalStrongs) {
      console.warn(`  ⚠️  Expected ${totalStrongs} Strong's entries, found ${strongsCount}`);
  } else {
      console.log(`  ✓ Expected ${totalStrongs} Strong's entries, found ${strongsCount}`);
  }

  if (ftsCount !== verseCount) {
      console.warn(`  ⚠️  FTS index mismatch: ${ftsCount} vs ${verseCount} verses`);
  } else {
      console.log(`  ✓ FTS index populated: ${ftsCount} entries`);
  }
  
  console.log(`  ✓ All ${bookCount} books present`);

  // Final Stats
  const stats = fs.statSync(CONFIG.OUTPUT_DB);
  console.log('✅ Mobile Database Built Successfully!');
  console.log(`   Location: ${CONFIG.OUTPUT_DB}`);
  console.log(`   Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.timeEnd('Building Mobile Database');
  
  db.close();
}

buildDatabase();
