
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://the_way_user:the_way_password@localhost:5432/the_way",
});

async function check() {
    const res = await pool.query('SELECT text FROM bible_verses WHERE book_id = 1 AND chapter = 1 AND verse = 1');
    console.log('Verse Text:', res.rows[0]?.text);
    await pool.end();
}
check();
