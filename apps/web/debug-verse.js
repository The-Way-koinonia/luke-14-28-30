
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://the_way_user:the_way_password@localhost:5432/the_way"
});

async function run() {
  const res = await pool.query(`
    SELECT bv.text 
    FROM bible_verses bv
    JOIN bible_books bb ON bv.book_id = bb.id
    WHERE bb.name = 'John' AND bv.chapter = 3 AND bv.verse = 1
  `);
  console.log("Raw Verse Content:", res.rows[0]);
  await pool.end();
}

run();
