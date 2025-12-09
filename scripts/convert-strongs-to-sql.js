const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://the_way_user:the_way_password@localhost:5432/the_way',
});

async function importDictionary(filePath, type) {
  console.log(`Reading ${type} dictionary from: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  const dictionary = JSON.parse(fs.readFileSync(filePath));
  const entries = Object.entries(dictionary);
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const tableName = type === 'greek' ? 'strongs_greek' : 'strongs_hebrew';
    let imported = 0;
    
    for (const [number, data] of entries) {
      const definition = data.def || data.definition || data.strongs_def || '';
      const lemma = data.lemma || data.greek || data.hebrew || '';
      const translit = data.translit || data.transliteration || data.xlit || '';
      const pronounce = data.pronounce || data.pronunciation || '';
      
      let strongsId = number;
      if (!strongsId.startsWith(type === 'greek' ? 'G' : 'H')) {
        strongsId = (type === 'greek' ? 'G' : 'H') + strongsId;
      }

      await client.query(`
        INSERT INTO ${tableName} (strongs_number, lemma, transliteration, pronunciation, definition)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (strongs_number) DO UPDATE SET 
        definition = EXCLUDED.definition, lemma = EXCLUDED.lemma, transliteration = EXCLUDED.transliteration;
      `, [strongsId, lemma, translit, pronounce, definition]);
      
      imported++;
      if (imported % 1000 === 0) process.stdout.write('.');
    }
    await client.query('COMMIT');
    console.log(`\nImported ${imported} ${type} entries.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
  }
}

async function main() {
  const greekPath = process.argv[2];
  const hebrewPath = process.argv[3];
  if (!greekPath || !hebrewPath) {
    console.error("Please provide paths to Greek and Hebrew JSON files");
    process.exit(1);
  }
  await importDictionary(greekPath, 'greek');
  await importDictionary(hebrewPath, 'hebrew');
  await pool.end();
}

main();
