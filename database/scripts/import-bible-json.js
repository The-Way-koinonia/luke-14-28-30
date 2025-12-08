const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://the_way_user:your_password_here@localhost:5432/the_way',
});

// Helper to map book names to IDs ( reusing your existing map)
const BOOK_MAP = {
  'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, /* ... add all books ... */ 
  'John': 43, /* ... etc ... */
  // Add abbreviated names often found in JSONs if needed
  'Gen': 1, 'Exo': 2, 'Lev': 3, 'Joh': 43
};

async function importBibleJSON(jsonPath) {
  console.log(`🚀 Starting JSON import from: ${jsonPath}`);
  
  const rawData = fs.readFileSync(jsonPath);
  const bibleData = JSON.parse(rawData); // Assumes array of objects structure
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Optional: Clear existing data to avoid conflicts/duplicates
    // console.log('Cleaning old data...');
    // await client.query('TRUNCATE verse_words CASCADE');
    
    let processedVerses = 0;

    for (const entry of bibleData) {
      // Adjust these field names based on your specific JSON structure
      // Common structure: { book: "Genesis", chapter: 1, verse: 1, text: "In the..." }
      const bookName = entry.book || entry.book_name; 
      const bookId = BOOK_MAP[bookName] || BOOK_MAP[entry.book_id];
      const chapter = parseInt(entry.chapter);
      const verse = parseInt(entry.verse);
      const rawText = entry.text || '';

      if (!bookId) {
        console.warn(`⚠️ Skipped unknown book: ${bookName}`);
        continue;
      }

      // 1. Parse Strong's tags
      // Regex matches: <w lemma="strong:G746">Word</w>
      const wordRegex = /<w\s+lemma="strong:([GH]\d+)"[^>]*>([^<]+)<\/w>/g;
      const cleanText = rawText.replace(/<[^>]+>/g, ''); // Remove tags for main text
      
      // Update/Insert clean text into bible_verses
      await client.query(
        `INSERT INTO bible_verses (book_id, chapter, verse, text, translation)
         VALUES ($1, $2, $3, $4, 'KJV')
         ON CONFLICT (translation, book_id, chapter, verse) 
         DO UPDATE SET text = EXCLUDED.text`,
        [bookId, chapter, verse, cleanText]
      );

      // 2. Extract and Insert Words
      let match;
      let wordPosition = 0;
      
      // Reset regex index
      wordRegex.lastIndex = 0;
      
      while ((match = wordRegex.exec(rawText)) !== null) {
        const strongsNum = match[1]; // e.g., G746
        const wordText = match[2];   // e.g., beginning
        
        await client.query(
          `INSERT INTO verse_words (book_id, chapter, verse, word_position, word_text, strongs_number)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [bookId, chapter, verse, wordPosition++, wordText, strongsNum]
        );
      }
      
      processedVerses++;
      if (processedVerses % 500 === 0) process.stdout.write('.');
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Imported ${processedVerses} verses with Strong's numbers!`);
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Import failed:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

// Usage: node import-bible-json.js path/to/bible.json
importBibleJSON(process.argv[2]);