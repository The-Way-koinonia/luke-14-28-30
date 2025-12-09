const { Pool } = require('pg');
const fs = require('fs');
const https = require('https');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://the_way_user:the_way_password@localhost:5432/the_way',
});

// Robust Book Map
const BOOK_MAP = {
  'Gen': 1, 'Genesis': 1,
  'Exod': 2, 'Exodus': 2, 'Exo': 2,
  'Lev': 3, 'Leviticus': 3,
  'Num': 4, 'Numbers': 4,
  'Deut': 5, 'Deuteronomy': 5, 'Deu': 5,
  'Josh': 6, 'Joshua': 6,
  'Judg': 7, 'Judges': 7,
  'Ruth': 8,
  '1Sam': 9, '1 Samuel': 9, '1Sa': 9,
  '2Sam': 10, '2 Samuel': 10, '2Sa': 10,
  '1Kgs': 11, '1 Kings': 11, '1Ki': 11,
  '2Kgs': 12, '2 Kings': 12, '2Ki': 12,
  '1Chr': 13, '1 Chronicles': 13, '1Ch': 13,
  '2Chr': 14, '2 Chronicles': 14, '2Ch': 14,
  'Ezra': 15,
  'Neh': 16, 'Nehemiah': 16,
  'Esth': 17, 'Esther': 17,
  'Job': 18,
  'Ps': 19, 'Psalms': 19, 'Psa': 19,
  'Prov': 20, 'Proverbs': 20,
  'Eccl': 21, 'Ecclesiastes': 21,
  'Song': 22, 'Song of Solomon': 22, 'Song of Songs': 22,
  'Isa': 23, 'Isaiah': 23,
  'Jer': 24, 'Jeremiah': 24,
  'Lam': 25, 'Lamentations': 25,
  'Ezek': 26, 'Ezekiel': 26,
  'Dan': 27, 'Daniel': 27,
  'Hos': 28, 'Hosea': 28,
  'Joel': 29,
  'Amos': 30,
  'Obad': 31, 'Obadiah': 31,
  'Jonah': 32,
  'Mic': 33, 'Micah': 33,
  'Nah': 34, 'Nahum': 34,
  'Hab': 35, 'Habakkuk': 35,
  'Zeph': 36, 'Zephaniah': 36,
  'Hag': 37, 'Haggai': 37,
  'Zech': 38, 'Zechariah': 38,
  'Mal': 39, 'Malachi': 39,
  'Matt': 40, 'Matthew': 40,
  'Mark': 41,
  'Luke': 42,
  'John': 43,
  'Acts': 44,
  'Rom': 45, 'Romans': 45,
  '1Cor': 46, '1 Corinthians': 46,
  '2Cor': 47, '2 Corinthians': 47,
  'Gal': 48, 'Galatians': 48,
  'Eph': 49, 'Ephesians': 49,
  'Phil': 50, 'Philippians': 50,
  'Col': 51, 'Colossians': 51,
  '1Thess': 52, '1 Thessalonians': 52,
  '2Thess': 53, '2 Thessalonians': 53,
  '1Tim': 54, '1 Timothy': 54,
  '2Tim': 55, '2 Timothy': 55,
  'Titus': 56,
  'Phlm': 57, 'Philemon': 57,
  'Heb': 58, 'Hebrews': 58,
  'Jas': 59, 'James': 59,
  '1Pet': 60, '1 Peter': 60,
  '2Pet': 61, '2 Peter': 61,
  '1John': 62, '1 John': 62,
  '2John': 63, '2 John': 63,
  '3John': 64, '3 John': 64,
  'Jude': 65,
  'Rev': 66, 'Revelation': 66, 'Revelation of John': 66
};

const XML_URL = "https://raw.githubusercontent.com/seven1m/open-bibles/master/eng-kjv.osis.xml";

async function downloadFile(url, dest) {
  console.log(`⬇️  Downloading from ${url}...`);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ Download complete.');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function processXML(filePath) {
  console.log(`📖 Reading XML from: ${filePath}`);
  const rawData = fs.readFileSync(filePath, 'utf8');

  // --- DEBUGGING: PRINT A SAMPLE VERSE ---
  // Look for Genesis 1:1 or similar
  const sampleMatch = /<verse osisID="Gen.1.1"[^>]*>(.*?)<\/verse>/s.exec(rawData);
  if (sampleMatch) {
    console.log("\n🔎 SAMPLE VERSE CONTENT (Gen 1:1):");
    console.log(sampleMatch[1].trim());
    console.log("-------------------------------------------\n");
  } else {
    // If Gen 1:1 not found, print first 500 chars
    console.log("\n🔎 HEAD OF FILE:");
    console.log(rawData.substring(0, 500));
    console.log("-------------------------------------------\n");
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Regex for OSIS verses
    const verseRegex = /<verse osisID="([^"]+)"[^>]*>(.*?)<\/verse>/gs;
    
    let match;
    let processed = 0;
    let insertedWords = 0;

    console.log('⚙️  Parsing verses...');
    
    while ((match = verseRegex.exec(rawData)) !== null) {
      const osisRef = match[1]; 
      const content = match[2]; 
      
      const parts = osisRef.split('.');
      if (parts.length < 3) continue;
      
      const bookKey = parts[0];
      const chapter = parseInt(parts[1]);
      const verse = parseInt(parts[2]);
      const bookId = BOOK_MAP[bookKey];

      if (!bookId) continue;

      // --- ULTRA FLEXIBLE REGEX ---
      // 1. Matches <w lemma="strong:H123">Text</w>
      // 2. Matches <w strong="H123">Text</w>
      // 3. Matches <w ...>Text</w> and tries to find strongs inside tag
      
      // Look for ANY <w> tag
      const wTagRegex = /<w\s+([^>]+)>(.*?)<\/w>/g;
      let wMatch;
      
      while ((wMatch = wTagRegex.exec(content)) !== null) {
        const attributes = wMatch[1];
        const wordText = wMatch[2]; // Clean this later if needed
        
        // Find Strong's number in attributes
        // Looks for "strong:H123" OR "H123" inside attributes
        const strongMatch = /strong:([GH]\d+)/i.exec(attributes) || 
                            /lemma="([GH]\d+)"/i.exec(attributes) ||
                            /strong="([GH]\d+)"/i.exec(attributes);

        if (strongMatch) {
            const strongsNumber = strongMatch[1].toUpperCase();
            
            await client.query(
              `INSERT INTO verse_words (book_id, chapter, verse, word_position, word_text, strongs_number)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT DO NOTHING`,
              [bookId, chapter, verse, insertedWords, wordText, strongsNumber]
            );
            insertedWords++;
        }
      }
      
      processed++;
      if (processed % 2000 === 0) process.stdout.write('.');
    }

    if (insertedWords === 0) {
      console.warn("\n❌ FAILURE: No Strong's numbers found with flexible regex.");
      console.warn("   Check the SAMPLE VERSE output above to see the real tag format.");
      await client.query('ROLLBACK');
    } else {
      await client.query('COMMIT');
      console.log(`\n\n🎉 Success!`);
      console.log(`- Processed Verses: ${processed}`);
      console.log(`- Inserted Word Links: ${insertedWords}`);
    }

  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function main() {
  const tempPath = path.join(__dirname, 'kjv_debug.xml');
  
  // Always start fresh
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

  try {
    await downloadFile(XML_URL, tempPath);
    await processXML(tempPath);
  } catch (err) {
    console.error(`❌ Failed: ${err.message}`);
    process.exit(1);
  }
}

main();
