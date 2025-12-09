const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://the_way_user:the_way_password@localhost:5432/the_way',
});

// Enhanced Map with Aliases
const BOOK_MAP = {
  'Genesis': 1, 'Gen': 1,
  'Exodus': 2, 'Exo': 2,
  'Leviticus': 3, 'Lev': 3,
  'Numbers': 4, 'Num': 4,
  'Deuteronomy': 5, 'Deu': 5,
  'Joshua': 6, 'Jos': 6,
  'Judges': 7, 'Jdg': 7,
  'Ruth': 8, 'Rut': 8,
  '1 Samuel': 9, '1Sa': 9, '1 Sam': 9, 'I Samuel': 9,
  '2 Samuel': 10, '2Sa': 10, '2 Sam': 10, 'II Samuel': 10,
  '1 Kings': 11, '1Ki': 11, '1 Ki': 11, 'I Kings': 11,
  '2 Kings': 12, '2Ki': 12, '2 Ki': 12, 'II Kings': 12,
  '1 Chronicles': 13, '1Ch': 13, '1 Chron': 13, 'I Chronicles': 13,
  '2 Chronicles': 14, '2Ch': 14, '2 Chron': 14, 'II Chronicles': 14,
  'Ezra': 15, 'Ezr': 15,
  'Nehemiah': 16, 'Neh': 16,
  'Esther': 17, 'Est': 17,
  'Job': 18,
  'Psalms': 19, 'Psa': 19, 'Psalm': 19, // Common mismatch
  'Proverbs': 20, 'Pro': 20,
  'Ecclesiastes': 21, 'Ecc': 21, 'Qoheleth': 21,
  'Song of Solomon': 22, 'Son': 22, 'Song of Songs': 22, 'Canticles': 22, // Common mismatch
  'Isaiah': 23, 'Isa': 23,
  'Jeremiah': 24, 'Jer': 24,
  'Lamentations': 25, 'Lam': 25,
  'Ezekiel': 26, 'Eze': 26,
  'Daniel': 27, 'Dan': 27,
  'Hosea': 28, 'Hos': 28,
  'Joel': 29, 'Joe': 29,
  'Amos': 30, 'Amo': 30,
  'Obadiah': 31, 'Oba': 31,
  'Jonah': 32, 'Jon': 32,
  'Micah': 33, 'Mic': 33,
  'Nahum': 34, 'Nah': 34,
  'Habakkuk': 35, 'Hab': 35,
  'Zephaniah': 36, 'Zep': 36,
  'Haggai': 37, 'Hag': 37,
  'Zechariah': 38, 'Zec': 38,
  'Malachi': 39, 'Mal': 39,
  'Matthew': 40, 'Mat': 40, 'Matt': 40,
  'Mark': 41, 'Mar': 41,
  'Luke': 42, 'Luk': 42,
  'John': 43, 'Joh': 43,
  'Acts': 44, 'Act': 44,
  'Romans': 45, 'Rom': 45,
  '1 Corinthians': 46, '1Co': 46, '1 Cor': 46, 'I Corinthians': 46,
  '2 Corinthians': 47, '2Co': 47, '2 Cor': 47, 'II Corinthians': 47,
  'Galatians': 48, 'Gal': 48,
  'Ephesians': 49, 'Eph': 49,
  'Philippians': 50, 'Phi': 50, 'Phil': 50,
  'Colossians': 51, 'Col': 51,
  '1 Thessalonians': 52, '1Th': 52, '1 Thess': 52, 'I Thessalonians': 52,
  '2 Thessalonians': 53, '2Th': 53, '2 Thess': 53, 'II Thessalonians': 53,
  '1 Timothy': 54, '1Ti': 54, '1 Tim': 54, 'I Timothy': 54,
  '2 Timothy': 55, '2Ti': 55, '2 Tim': 55, 'II Timothy': 55,
  'Titus': 56, 'Tit': 56,
  'Philemon': 57, 'Phm': 57,
  'Hebrews': 58, 'Heb': 58,
  'James': 59, 'Jam': 59,
  '1 Peter': 60, '1Pe': 60, '1 Pet': 60, 'I Peter': 60,
  '2 Peter': 61, '2Pe': 61, '2 Pet': 61, 'II Peter': 61,
  '1 John': 62, '1Jo': 62, '1 Jn': 62, 'I John': 62,
  '2 John': 63, '2Jo': 63, '2 Jn': 63, 'II John': 63,
  '3 John': 64, '3Jo': 64, '3 Jn': 64, 'III John': 64,
  'Jude': 65, 'Jud': 65,
  'Revelation': 66, 'Rev': 66, 'The Revelation': 66
};

async function importBibleJSON(jsonPath) {
  console.log(`Starting import from: ${jsonPath}`);
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath);
  let jsonData = JSON.parse(rawData);

  // Normalize Data
  let flatVerses = [];
  if (!Array.isArray(jsonData)) {
     if (jsonData.result) jsonData = jsonData.result;
     else if (jsonData.data) jsonData = jsonData.data;
     else if (jsonData.books) jsonData = jsonData.books;
  }

  // Flatten logic
  const isBookList = jsonData.length === 66 || (jsonData[0] && jsonData[0].chapters);
  if (isBookList) {
    console.log("Flattening Book-Chapter structure...");
    for (const book of jsonData) {
      const bookName = book.book || book.name || book.id; 
      const chapters = book.chapters || [];
      for (const chapter of chapters) {
        const chapterNum = chapter.chapter || chapter.id;
        const verses = Array.isArray(chapter) ? chapter : (chapter.verses || []);
        for (const verse of verses) {
            flatVerses.push({
                book: bookName,
                chapter: chapterNum,
                verse: verse.verse || verse.id,
                text: verse.text
            });
        }
      }
    }
  } else {
    flatVerses = jsonData;
  }

  console.log(`Ready to process ${flatVerses.length} verses...`);

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    let processed = 0;
    let insertedWords = 0;
    let skippedBooks = new Set();
    let sampleTagFound = false;

    for (const entry of flatVerses) {
      const bookName = entry.book || entry.book_name;
      const bookId = BOOK_MAP[bookName];
      
      if (!bookId) {
        skippedBooks.add(bookName);
        continue;
      }

      const rawText = entry.text || '';
      if (rawText.includes('<w lemma')) sampleTagFound = true;

      // Extract Words
      const wordRegex = /<w\s+lemma="strong:([GH]\d+)"[^>]*>([^<]+)<\/w>/g;
      let match;
      let pos = 0;
      
      while ((match = wordRegex.exec(rawText)) !== null) {
        const strongsNumber = match[1];
        const wordText = match[2];

        await client.query(
          `INSERT INTO verse_words (book_id, chapter, verse, word_position, word_text, strongs_number)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [bookId, entry.chapter, entry.verse, pos++, wordText, strongsNumber]
        );
        insertedWords++;
      }
      
      processed++;
      if (processed % 2000 === 0) process.stdout.write('.');
    }

    await client.query('COMMIT');
    console.log(`\n\n🎉 Done!`);
    console.log(`- Processed Verses: ${processed}`);
    console.log(`- Inserted Word Links: ${insertedWords}`);
    
    if (skippedBooks.size > 0) {
      console.warn(`\n⚠️ Skipped Books (Add these to BOOK_MAP):`, Array.from(skippedBooks));
    }
    
    if (!sampleTagFound) {
      console.warn(`\n❌ WARNING: No Strong's tags (e.g. <w lemma="strong:H123">) were found in the text.`);
      console.warn(`   Your JSON file appears to be plain text. You need a "Strong's Tagged" KJV JSON file.`);
    }

  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

importBibleJSON(process.argv[2]);
