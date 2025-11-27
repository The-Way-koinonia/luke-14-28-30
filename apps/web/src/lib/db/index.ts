import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});

export const db = {
  async query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
    const result = await pool.query(text, params);
    return result.rows;
  }
};