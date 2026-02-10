
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://the_way_user:the_way_password@localhost:5432/the_way",
});

async function importStrongs() {
    console.log('Starting Strongs Import...');

    // 1. Hebrews
    const hebrewPath = '/Users/colinmontes/The Way/The Way/strongs/hebrew/StrongHebrewG.xml';
    console.log(`Processing Hebrew: ${hebrewPath}`);
    const hebrewContent = fs.readFileSync(hebrewPath, 'utf8');
    
    // Regex for Hebrew Entries
    // <div type="entry" n="1"> ... </div>
    const hebrewEntryRegex = /<div type="entry"[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    let hebrewCount = 0;
    let values = [];

    while ((match = hebrewEntryRegex.exec(hebrewContent)) !== null) {
        const entryBlock = match[1];
        
        // ID="H1"
        const idMatch = /ID="([^"]+)"/.exec(entryBlock);
        if (!idMatch) continue;
        const id = idMatch[1]; // e.g., H1

        // Word (unicode in <w> tag content? No, looking at lines 64: <w ...>אב</w>)
        // But checking line 64: <w gloss="4a" lemma="אָב" morph="n-m" POS="awb" xlit="ʼâb" ID="H1" xml:lang="heb">אב</w>
        // The word itself is the text content of the w tag with the ID.
        // We regex for the w tag having that ID.
        const wordRegex = new RegExp(`<w[^>]*ID="${id}"[^>]*>([^<]+)<\\/w>`);
        const wordMatch = wordRegex.exec(entryBlock);
        const originalWord = wordMatch ? wordMatch[1] : '';

        // Transliteration (xlit attribute in the same tag)
        const xlitMatch = new RegExp(`<w[^>]*ID="${id}"[^>]*xlit="([^"]+)"`).exec(entryBlock);
        const transliteration = xlitMatch ? xlitMatch[1] : '';

        // Definition: <note type="explanation">...</note>
        // Often contains <hi>...</hi> tags, we should strip them or keep them? 
        // Let's strip tags for clean text, or keep if web app renders html.
        // The API returns it as "definition". Let's strip HTML tags for now to be safe/clean.
        const defMatch = /<note type="explanation">([\s\S]*?)<\/note>/.exec(entryBlock);
        let definition = defMatch ? defMatch[1] : '';
        definition = definition.replace(/<[^>]+>/g, ''); // Strip tags like <hi>

        values.push([id, originalWord, transliteration, definition, '', 'OT']);
        hebrewCount++;
    }
    console.log(`Found ${hebrewCount} Hebrew entries.`);

    // 2. Greek
    const greekPath = '/Users/colinmontes/The Way/The Way/strongs/greek/StrongsGreekDictionaryXML_1.4/strongsgreek.xml';
    console.log(`Processing Greek: ${greekPath}`);
    const greekContent = fs.readFileSync(greekPath, 'utf8');

    // Regex for Greek Entries
    // <entry strongs="00001"> ... </entry>
    const greekEntryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/g;
    let greekCount = 0;

    while ((match = greekEntryRegex.exec(greekContent)) !== null) {
        const entryBlock = match[1];

        // ID: <strongs>1</strongs>
        const idInnerMatch = /<strongs>(\d+)<\/strongs>/.exec(entryBlock);
        if (!idInnerMatch) continue;
        const numId = idInnerMatch[1];
        const id = `G${numId}`; // e.g. G1
        
        // Word: <greek ... unicode="Α" .../>
        const wordMatch = /<greek[^>]*unicode="([^"]+)"/.exec(entryBlock);
        const originalWord = wordMatch ? wordMatch[1] : '';

        // Transliteration: translit attribute
        const xlitMatch = /<greek[^>]*translit="([^"]+)"/.exec(entryBlock);
        const transliteration = xlitMatch ? xlitMatch[1] : '';

        // Pronunciation: <pronunciation strongs="..."/>
        const pronMatch = /<pronunciation strongs="([^"]+)"/.exec(entryBlock);
        const pronunciation = pronMatch ? pronMatch[1] : '';

        // Definition: <strongs_def> ... </strongs_def>
        const defMatch = /<strongs_def>([\s\S]*?)<\/strongs_def>/.exec(entryBlock);
        let definition = defMatch ? defMatch[1] : '';
        definition = definition.replace(/<[^>]+>/g, '').trim(); 
        // Remove trailing colon if common e.g. "definition : "
        if (definition.endsWith(':')) definition = definition.slice(0, -1).trim();

        values.push([id, originalWord, transliteration, definition, pronunciation, 'NT']);
        greekCount++;
    }
    console.log(`Found ${greekCount} Greek entries.`);

    // 3. Insert into DB
    // Use upsert ON CONFLICT
    // Schema assumption: strongs_definitions(strongs_number, original_word, transliteration, definition, pronunciation)
    // We need to check schema to be sure of column names. 
    // Assuming: 
    // table: strongs_definitions
    // columns: strongs_number (PK), original_word, transliteration, definition, pronunciation
    // We will batch insert.
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Use Upsert to avoid FK issues and duplicates
        console.log('Inserting/Updating data...');
        // await client.query('TRUNCATE TABLE strongs_definitions CASCADE'); // unsafe

        const batchSize = 1000;
        for (let i = 0; i < values.length; i += batchSize) {
            const batch = values.slice(i, i + batchSize);
            const params = [];
            
            // Generate multiple value sets ($1, $2, ..), ($7, $8, ..)
            const placeholders = batch.map((row, idx) => {
                const offset = idx * 6;
                params.push(row[0], row[1], row[2], row[3], row[4], row[5]); 
                return `($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5}, $${offset+6})`;
            }).join(', ');

            const query = `
                INSERT INTO strongs_definitions (strongs_number, original_word, transliteration, definition, pronunciation, testament) 
                VALUES ${placeholders}
                ON CONFLICT (strongs_number) 
                DO UPDATE SET 
                    original_word = EXCLUDED.original_word,
                    transliteration = EXCLUDED.transliteration,
                    definition = EXCLUDED.definition,
                    pronunciation = EXCLUDED.pronunciation,
                    testament = EXCLUDED.testament;
            `;
            
            await client.query(query, params);
            process.stdout.write(`.`);
        }
        
        await client.query('COMMIT');
        console.log('\nImport complete!');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        client.release();
    }
    
    await pool.end();
}

importStrongs().catch(console.error);
