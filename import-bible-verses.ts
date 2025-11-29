import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Database connection
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://the_way_user:your_password_here@localhost:5432/the_way',
});

// Book name to book_id mapping
const BOOK_NAME_MAP: { [key: string]: number } = {
  Genesis: 1,
  Exodus: 2,
  Leviticus: 3,
  Numbers: 4,
  Deuteronomy: 5,
  Joshua: 6,
  Judges: 7,
  Ruth: 8,
  '1 Samuel': 9,
  'I Samuel': 9,
  '2 Samuel': 10,
  'II Samuel': 10,
  '1 Kings': 11,
  'I Kings': 11,
  '2 Kings': 12,
  'II Kings': 12,
  '1 Chronicles': 13,
  'I Chronicles': 13,
  '2 Chronicles': 14,
  'II Chronicles': 14,
  Ezra: 15,
  Nehemiah: 16,
  Esther: 17,
  Job: 18,
  Psalms: 19,
  Proverbs: 20,
  Ecclesiastes: 21,
  'Song of Solomon': 22,
  Isaiah: 23,
  Jeremiah: 24,
  Lamentations: 25,
  Ezekiel: 26,
  Daniel: 27,
  Hosea: 28,
  Joel: 29,
  Amos: 30,
  Obadiah: 31,
  Jonah: 32,
  Micah: 33,
  Nahum: 34,
  Habakkuk: 35,
  Zephaniah: 36,
  Haggai: 37,
  Zechariah: 38,
  Malachi: 39,
  Matthew: 40,
  Mark: 41,
  Luke: 42,
  John: 43,
  Acts: 44,
  Romans: 45,
  '1 Corinthians': 46,
  'I Corinthians': 46,
  '2 Corinthians': 47,
  'II Corinthians': 47,
  Galatians: 48,
  Ephesians: 49,
  Philippians: 50,
  Colossians: 51,
  '1 Thessalonians': 52,
  'I Thessalonians': 52,
  '2 Thessalonians': 53,
  'II Thessalonians': 53,
  '1 Timothy': 54,
  'I Timothy': 54,
  '2 Timothy': 55,
  'II Timothy': 55,
  Titus: 56,
  Philemon: 57,
  Hebrews: 58,
  James: 59,
  '1 Peter': 60,
  'I Peter': 60,
  '2 Peter': 61,
  'II Peter': 61,
  '1 John': 62,
  'I John': 62,
  '2 John': 63,
  'II John': 63,
  '3 John': 64,
  'III John': 64,
  Jude: 65,
  Revelation: 66,
};

interface VerseData {
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
}

async function importBibleVerses(csvFilePath: string) {
  console.log('🚀 Starting Bible verse import...');
  console.log(`📖 Reading from: ${csvFilePath}`);

  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`File not found: ${csvFilePath}`);
  }

  const fileStream = fs.createReadStream(csvFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const verses: VerseData[] = [];
  let lineNumber = 0;
  let skippedLines = 0;

  for await (const line of rl) {
    lineNumber++;

    // Skip empty lines
    if (!line.trim()) continue;

    // Parse CSV line (simple parser - assumes no commas in verse text for now)
    // Format appears to be: book,chapter,verse,text
    const parts = line.split(',');

    if (parts.length < 4) {
      console.warn(`⚠️  Line ${lineNumber}: Invalid format, skipping`);
      skippedLines++;
      continue;
    }

    const bookName = parts[0].trim();
    const chapter = parseInt(parts[1].trim());
    const verse = parseInt(parts[2].trim());
    const text = parts.slice(3).join(',').trim(); // Rejoin in case text had commas

    // Map book name to book_id
    const bookId = BOOK_NAME_MAP[bookName];

    if (!bookId) {
      console.warn(
        `⚠️  Line ${lineNumber}: Unknown book "${bookName}", skipping`
      );
      skippedLines++;
      continue;
    }

    if (isNaN(chapter) || isNaN(verse)) {
      console.warn(
        `⚠️  Line ${lineNumber}: Invalid chapter/verse numbers, skipping`
      );
      skippedLines++;
      continue;
    }

    verses.push({
      book_id: bookId,
      chapter,
      verse,
      text: text.replace(/^"|"$/g, ''), // Remove quotes if present
    });

    // Progress update every 1000 verses
    if (verses.length % 1000 === 0) {
      console.log(`📝 Parsed ${verses.length} verses...`);
    }
  }

  console.log(`\n✅ Finished parsing CSV`);
  console.log(`📊 Total verses parsed: ${verses.length}`);
  console.log(`⚠️  Lines skipped: ${skippedLines}`);

  // Now insert into database in batches
  console.log('\n💾 Starting database import...');

  const batchSize = 100;
  let imported = 0;

  for (let i = 0; i < verses.length; i += batchSize) {
    const batch = verses.slice(i, i + batchSize);

    // Build bulk insert query
    const values = batch
      .map((v, idx) => {
        const offset = idx * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${
          offset + 4
        })`;
      })
      .join(', ');

    const params = batch.flatMap((v) => [
      v.book_id,
      v.chapter,
      v.verse,
      v.text,
    ]);

    const query = `
      INSERT INTO bible_verses (book_id, chapter, verse, text)
      VALUES ${values}
      ON CONFLICT (translation, book_id, chapter, verse) DO NOTHING
    `;

    try {
      await pool.query(query, params);
      imported += batch.length;

      if (imported % 1000 === 0) {
        console.log(`💾 Imported ${imported} / ${verses.length} verses...`);
      }
    } catch (error) {
      console.error(`❌ Error importing batch at verse ${i}:`, error);
      throw error;
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`📊 Total verses imported: ${imported}`);

  // Verify import
  const result = await pool.query('SELECT COUNT(*) FROM bible_verses');
  console.log(
    `\n🔍 Database verification: ${result.rows[0].count} verses in database`
  );

  // Test query - John 3:16
  const john316 = await pool.query(
    'SELECT * FROM bible_verses WHERE book_id = 43 AND chapter = 3 AND verse = 16'
  );

  if (john316.rows.length > 0) {
    console.log("\n🎉 SUCCESS! Here's John 3:16:");
    console.log(`📖 ${john316.rows[0].text}`);
  } else {
    console.log('\n⚠️  Warning: Could not find John 3:16');
  }

  await pool.end();
}

// Main execution
const csvPath =
  process.argv[2] ||
  '/Users/colinmontes/The Way/bible_databases/formats/csv/KJV.csv';

importBibleVerses(csvPath)
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
