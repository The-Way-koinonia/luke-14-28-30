const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://the_way_user:the_way_password@localhost:5432/the_way"
});

async function verify() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check Books
    const booksRes = await client.query('SELECT COUNT(*) FROM "KJV_books"');
    const bookCount = parseInt(booksRes.rows[0].count);
    console.log(`📚 Books found: ${bookCount}`);

    if (bookCount === 0) {
      console.error('❌ No books found! You likely need to run `npm run db:import`');
    } else if (bookCount === 66) {
      console.log('✅ All 66 books present');
    } else {
      console.warn(`⚠️ Unexpected number of books: ${bookCount}`);
    }

    // Check Verses
    const versesRes = await client.query('SELECT COUNT(*) FROM "KJV_verses"');
    const verseCount = parseInt(versesRes.rows[0].count);
    console.log(`📖 Verses found: ${verseCount}`);

    if (verseCount === 0) {
      console.error('❌ No verses found! You likely need to run `npm run db:import`');
    } else if (verseCount > 31000) {
      console.log('✅ Verse count looks correct (>31000)');
    } else {
      console.warn(`⚠️ Verse count seems low: ${verseCount}`);
    }

    // Check a specific verse (John 3:16)
    // John is usually book 43 (Matthew=40, Mark=41, Luke=42, John=43 if standard numbering starting OT)
    // Let's look up the book ID for John first to be safe
    const johnRes = await client.query('SELECT id FROM "KJV_books" WHERE name = $1', ['John']);
    
    if (johnRes.rows.length > 0) {
        const johnId = johnRes.rows[0].id;
        const john316Res = await client.query(
            'SELECT text FROM "KJV_verses" WHERE book_id = $1 AND chapter = 3 AND verse = 16',
            [johnId]
        );

        if (john316Res.rows.length > 0) {
            console.log(`✅ John 3:16 found: "${john316Res.rows[0].text.substring(0, 50)}..."`);
        } else {
            console.error('❌ John 3:16 NOT found');
        }
    } else {
        console.error('❌ Book "John" not found');
    }

  } catch (err) {
    console.error('❌ Database error:', err);
  } finally {
    await client.end();
  }
}

verify();
