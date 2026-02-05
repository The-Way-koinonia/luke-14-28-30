
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://the_way_user:the_way_password@localhost:5432/the_way",
});

async function check() {
    const res = await pool.query('SELECT strongs_number FROM strongs_definitions LIMIT 5');
    console.log('Sample IDs:', res.rows.map(r => r.strongs_number));
    
    // Check for H430 specifically if possible
    const res2 = await pool.query("SELECT strongs_number FROM strongs_definitions WHERE strongs_number LIKE '%430%' LIMIT 5");
    console.log('Search matches:', res2.rows.map(r => r.strongs_number));
    
    await pool.end();
}
check();
