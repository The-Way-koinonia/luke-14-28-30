import { Pool } from 'pg';
import 'dotenv/config';

// 1. Get the connection string securely from the environment variables
// This variable is defined in your .env.local file.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // CRITICAL: Log a clear error if the connection string is missing
  console.error("CRITICAL: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

// 2. Configure the PostgreSQL Connection Pool
// A connection pool is necessary to efficiently manage multiple database connections
// from your web server, making it fast and scalable.
const pool = new Pool({
  connectionString: connectionString,
  // Optional: Add SSL settings if your production DB requires it (Google Cloud SQL often does)
  // ssl: {
  //   rejectUnauthorized: false
  // }
});

// 3. Export a function to handle running queries
// This allows other files to interact with the database without managing the pool.
export const db = {
  /**
   * Runs a SQL query against the connection pool.
   * @param text The SQL query string (e.g., 'SELECT * FROM users WHERE id = $1')
   * @param params Optional array of values to safely sanitize the query
   * @returns The query result object
   */
  async query(text: string, params?: any[]) {
    // Log query details for debugging (useful in development)
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query: ${text.substring(0, 50)}... in ${duration}ms`);
    return res;
  },

  // Future additions could include: client connection, transactions, etc.
};

console.log("PostgreSQL Connection Pool initialized.");