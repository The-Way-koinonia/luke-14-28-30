const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// --- Configuration ---
const DB_PATH = path.join(__dirname, 'data', 'bible.db');
const GREEK_SOURCE = path.join(__dirname, '../../strongs/greek/strongs-greek-dictionary.js');
const HEBREW_SOURCE = path.join(__dirname, '../../strongs/hebrew/strongs-hebrew-dictionary.js');

// --- Main Execution ---
(function main() {
  const startTime = Date.now();
  console.log('🚀 Starting Strong\'s Dictionary Import...');

  // 1. Validate environment
  if (!validateFiles()) {
    process.exit(1);
  }

  // 2. Initialize Database
  let db;
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = new Database(DB_PATH);
    console.log(`📦 Database opened at: ${DB_PATH}`);
    
    // Performance tuning for import
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message);
    process.exit(1);
  }

  try {
    // 3. Create Schema
    createSchema(db);

    // 4. Import Data
    const totalGreek = importDictionary(db, GREEK_SOURCE, 'Greek', 'NT', 'G');
    const totalHebrew = importDictionary(db, HEBREW_SOURCE, 'Hebrew', 'OT', 'H');

    // 5. Final Report
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n=========================================');
    console.log(`✅ Import Complete in ${totalTime}s`);
    console.log(`🇬🇷 Greek Entries:  ${totalGreek.toLocaleString()}`);
    console.log(`🇮🇱 Hebrew Entries: ${totalHebrew.toLocaleString()}`);
    console.log(`📚 Total Imported: ${(totalGreek + totalHebrew).toLocaleString()}`);
    console.log('=========================================');
    
  } catch (err) {
    console.error('\n❌ Fatal Error during import:', err);
    process.exit(1);
  } finally {
    if (db) db.close();
  }
})();

// --- Helper Functions ---

function validateFiles() {
  const missing = [];
  if (!fs.existsSync(GREEK_SOURCE)) missing.push(GREEK_SOURCE);
  if (!fs.existsSync(HEBREW_SOURCE)) missing.push(HEBREW_SOURCE);

  if (missing.length > 0) {
    console.error('❌ Error: Missing source data files:');
    missing.forEach(f => console.error(`   - ${f}`));
    return false;
  }
  return true;
}

function createSchema(db) {
  console.log('🛠️  Creating database schema...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS strongs_definitions (
      strongs_number TEXT PRIMARY KEY,
      testament TEXT,  -- 'OT' or 'NT'
      original_word TEXT,
      transliteration TEXT,
      pronunciation TEXT,
      part_of_speech TEXT,
      definition TEXT NOT NULL,
      kjv_usage TEXT
    );
  `);
}

function validateEntry(num, entry, testament) {
  if (!num) return false;
  // Basic validation - definition is critical
  if (typeof entry !== 'object' || !entry.strongs_def) {
    // Some entries might be purely cross-references or empty, verify if this is expected.
    // However, prompt requirement says validation should return false.
    return false;
  }
  return true;
}

function loadData(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // The files are JS files exporting objects. 
    // We can evaluate them safely or require them if the environment allows.
    // Given the context is Node.js, require() is simplest IF the file is formatted as CommonJS.
    // However, looking at previous knowledge, they might be in a specific format.
    // Let's try to require it first.
    return require(filePath);
  } catch (err) {
    throw new Error(`Failed to load data from ${filePath}: ${err.message}`);
  }
}

function importDictionary(db, sourcePath, langName, testament, prefix) {
  console.log(`\n📖 Loading ${langName} Data...`);
  
  let dictionary;
  try {
    const rawData = loadData(sourcePath);
    // Handle different export names possibilities
    dictionary = rawData.strongsGreekDictionary || rawData.strongsHebrewDictionary || rawData;
  } catch (err) {
    console.error(`   ❌ Failed to load ${langName} file: ${err.message}`);
    return 0;
  }

  const entries = Object.entries(dictionary);
  console.log(`   Found ${entries.length.toLocaleString()} entries. Starting import...`);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO strongs_definitions (
      strongs_number, testament, original_word, transliteration,
      pronunciation, part_of_speech, definition, kjv_usage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  let skipped = 0;

  const transaction = db.transaction(() => {
    for (const [key, entry] of entries) {
      // Ensure strongs number format (e.g., G1, H1)
      let strongsNum = key.trim();
      if (!strongsNum.startsWith(prefix)) {
        strongsNum = prefix + strongsNum;
      }

      if (!validateEntry(strongsNum, entry, testament)) {
        console.warn(`   ⚠️  Skipping invalid entry: ${strongsNum}`);
        skipped++;
        continue;
      }

      insertStmt.run(
        strongsNum,
        testament,
        entry.lemma || null,
        entry.translit || entry.xlit || null,
        entry.pron || null,
        entry.partOfSpeech || null,
        entry.strongs_def || null,
        entry.kjv_def || null
      );
      count++;
    }
  });

  transaction();
  
  console.log(`   ✅ Imported ${count.toLocaleString()} ${langName} definitions.`);
  if (skipped > 0) {
    console.log(`   ⚠️  Skipped ${skipped.toLocaleString()} invalid entries.`);
  }
  
  return count;
}