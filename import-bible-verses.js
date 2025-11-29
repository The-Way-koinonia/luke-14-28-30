const { Pool } = require('pg');
const fs = require('fs');
const readline = require('readline');

console.log('🚀 Starting Bible verse import...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://the_way_user:your_password_here@localhost:5432/the_way',
});

const BOOK_MAP = {
  'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
  'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
  'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19,
  'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23,
  'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
  'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32,
  'Micah': 33, 'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36, 'Haggai': 37,
  'Zechariah': 38, 'Malachi': 39, 'Matthew': 40, 'Mark': 41, 'Luke': 42,
  'John': 43, 'Acts': 44, 'Romans': 45, '1 Corinthians': 46,
  '2 Corinthians': 47, 'Galatians': 48, 'Ephesians': 49, 'Philippians': 50,
  'Colossians': 51, '1 Thessalonians': 52, '2 Thessalonians': 53,
  '1 Timothy': 54, '2 Timothy': 55, 'Titus': 56, 'Philemon': 57,
  'Hebrews': 58, 'James': 59, '1 Peter': 60, '2 Peter': 61, '1 John': 62,
  '2 John': 63, '3 John': 64, 'Jude': 65, 'Revelation': 66
};

async function importBibleVerses(csvPath) {
  console.log(`📖 Reading from: ${csvPath}`);

  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({ input: fileStream });

  const verses = [];
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    if (lineNumber === 1) continue; // Skip header

    const match = line.match(/^([^,]+),(\d+),(\d+),(.+)$/);
    if (!match) continue;

    const [, bookName, chapter, verse, text] = match;
    const bookId = BOOK_MAP[bookName];
    
    if (!bookId) continue;

    verses.push({
      book_id: bookId,
      chapter: parseInt(chapter),
      verse: parseInt(verse),
      text: text.replace(/^"|"$/g, '')
    });

    if (verses.length % 1000 === 0) {
      console.log(`📝 Parsed ${verses.length} verses...`);
    }
  }

  console.log(`\n✅ Parsed ${verses.length} verses`);
  console.log('💾 Starting database import...');

  const batchSize = 100;
  let imported = 0;

  for (let i = 0; i < verses.length; i += batchSize) {
    const batch = verses.slice(i, i + batchSize);
    
    const values = batch.map((_, idx) => {
      const offset = idx * 4;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
    }).join(', ');

    const params = batch.flatMap(v => [v.book_id, v.chapter, v.verse, v.text]);

    await pool.query(
      `INSERT INTO bible_verses (book_id, chapter, verse, text) VALUES ${values}
       ON CONFLICT (translation, book_id, chapter, verse) DO NOTHING`,
      params
    );

    imported += batch.length;
    if (imported % 1000 === 0) {
      console.log(`💾 Imported ${imported} / ${verses.length} verses...`);
    }
  }

  console.log(`\n✅ Import complete! ${imported} verses`);

  const john316 = await pool.query(
    'SELECT * FROM bible_verses WHERE book_id = 43 AND chapter = 3 AND verse = 16'
  );

  if (john316.rows.length > 0) {
    console.log('\n🎉 SUCCESS! John 3:16:');
    console.log(`📖 ${john316.rows[0].text}`);
  }

  await pool.end();
}

const csvPath = process.argv[2];
importBibleVerses(csvPath)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
