import * as SQLite from 'expo-sqlite';
import { BibleRepository } from './BibleRepository';

export class MetadataRepository {
  private static TABLE = 'database_metadata';

  static async getConnection(): Promise<SQLite.SQLiteDatabase> {
    return BibleRepository.getInstance().getConnection();
  }

  static async getValue(key: string): Promise<string | null> {
    const db = await this.getConnection();
    const result = await db.getAllAsync<{ value: string }>(
      `SELECT value FROM ${this.TABLE} WHERE key = ?`,
      [key]
    );
    return result.length > 0 ? result[0].value : null;
  }

  static async setValue(key: string, value: string): Promise<void> {
    const db = await this.getConnection();
    await db.runAsync(
      `INSERT OR REPLACE INTO ${this.TABLE} (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, value, new Date().toISOString()]
    );
  }
}
