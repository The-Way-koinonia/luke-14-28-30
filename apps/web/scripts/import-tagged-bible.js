
const { Pool } = require('pg');
const fs = require('fs');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://the_way_user:the_way_password@localhost:5432/the_way",
});

const BOOK_NAME_MAP = {
  Genesis: 1, Exodus: 2, Leviticus: 3, Numbers: 4, Deuteronomy: 5, Joshua: 6, Judges: 7, Ruth: 8, '1 Samuel': 9, 'I Samuel': 9, '2 Samuel': 10, 'II Samuel': 10, '1 Kings': 11, 'I Kings': 11, '2 Kings': 12, 'II Kings': 12, '1 Chronicles': 13, 'I Chronicles': 13, '2 Chronicles': 14, 'II Chronicles': 14, Ezra: 15, Nehemiah: 16, Esther: 17, Job: 18, Psalms: 19, Proverbs: 20, Ecclesiastes: 21, 'Song of Solomon': 22, Isaiah: 23, Jeremiah: 24, Lamentations: 25, Ezekiel: 26, Daniel: 27, Hosea: 28, Joel: 29, Amos: 30, Obadiah: 31, Jonah: 32, Micah: 33, Nahum: 34, Habakkuk: 35, Zephaniah: 36, Haggai: 37, Zechariah: 38, Malachi: 39, Matthew: 40, Mark: 41, Luke: 42, John: 43, Acts: 44, Romans: 45, '1 Corinthians': 46, 'I Corinthians': 46, '2 Corinthians': 47, 'II Corinthians': 47, Galatians: 48, Ephesians: 49, Philippians: 50, Colossians: 51, '1 Thessalonians': 52, 'I Thessalonians': 52, '2 Thessalonians': 53, 'II Thessalonians': 53, '1 Timothy': 54, 'I Timothy': 54, '2 Timothy': 55, 'II Timothy': 55, Titus: 56, Philemon: 57, Hebrews: 58, James: 59, '1 Peter': 60, 'I Peter': 60, '2 Peter': 61, 'II Peter': 61, '1 John': 62, 'I John': 62, '2 John': 63, 'II John': 63, '3 John': 64, 'III John': 64, Jude: 65, Revelation: 66,
};

async function importTaggedBible() {
    const jsonPath = '/Users/colinmontes/The Way/bible_databases/sources/en/KJV/KJV_test.json';
    
    console.log(`Reading JSON from ${jsonPath}...`);
    const rawData = fs.readFileSync(jsonPath);
    const bibleData = JSON.parse(rawData);

    console.log('JSON parsed. Starting update...');

    let updatedCount = 0;
    
    // We will perform updates in batches
    // Or sequentially since node js is single threaded and db IO is async
    
    for (const book of bibleData.books) {
        const bookId = BOOK_NAME_MAP[book.name];
        if (!bookId) {
            console.warn(`Skipping unknown book: ${book.name}`);
            continue;
        }

        console.log(`Processing ${book.name}...`);
        
        for (const chapter of book.chapters) {
            for (const verse of chapter.verses) {
                const text = verse.text;
                
                // We update where book_id, chapter, verse match
                // Assuming 'translation' column implicitly matches widely or we update strictly
                // The current app uses the only rows available.
                
                try {
                    await pool.query(
                        `UPDATE bible_verses 
                         SET text = $1 
                         WHERE book_id = $2 AND chapter = $3 AND verse = $4`,
                        [text, bookId, verse.chapter, verse.verse]
                    );
                    updatedCount++;
                } catch (err) {
                    console.error(`Failed to update ${book.name} ${verse.chapter}:${verse.verse}`, err);
                }
            }
        }
    }
    
    console.log(`Finished! Updated ${updatedCount} verses.`);
    await pool.end();
}

importTaggedBible().catch(console.error);
