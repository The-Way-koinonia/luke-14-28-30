const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://the_way_user:your_password_here@localhost:5432/the_way',
});

async function importDictionary(filePath, type) {
  console.log(`📖 Reading ${type} dictionary from: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  const rawData = fs.readFileSync(filePath);
  const dictionary = JSON.parse(rawData);
  const entries = Object.entries(dictionary);
  
  console.log(`📝 Found ${entries.length} entries. Starting import...`);

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const tableName = type === 'greek' ? 'strongs_greek' : 'strongs_hebrew';
    let imported = 0;

    for (const [number, data] of entries) {
      // Handle different JSON structures (some use 'def', some 'definition', some 'strongs_def')
      const definition = data.def || data.definition || data.strongs_def || '';
      const lemma = data.lemma || data.greek || data.hebrew || '';
      const translit = data.translit || data.transliteration || data.xlit || '';
      const pronounce = data.pronounce || data.pronunciation || '';
      const derivation = data.derivation || data.deriv || '';

      // Normalize Strong's number (ensure it has G/H prefix if missing)
      let strongsId = number;
      if (!strongsId.startsWith(type === 'greek' ? 'G' : 'H')) {
        strongsId = (type === 'greek' ? 'G' : 'H') + strongsId;
      }

      const query = `
        INSERT INTO ${tableName} (strongs_number, lemma, transliteration, pronunciation, definition, derivation)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (strongs_number) 
        DO UPDATE SET 
          lemma = EXCLUDED.lemma,
          transliteration = EXCLUDED.transliteration,
          definition = EXCLUDED.definition;
      `;

      await client.query(query, [strongsId, lemma, translit, pronounce, definition, derivation]);
      
      imported++;
      if (imported % 1000 === 0) process.stdout.write(`.`);
    }

    await client.query('COMMIT');
    console.log(`\n✅ Imported ${imported} ${type} definitions successfully.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(`\n❌ Error importing ${type}:`, e);
  } finally {
    client.release();
  }
}

async function main() {
  // Update these paths to where you saved the JSON files
  await importDictionary('./data/strongs-greek-dictionary.json', 'greek');
  await importDictionary('./data/strongs-hebrew-dictionary.json', 'hebrew');
  await pool.end();
}

main();