import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { BibleBook, BibleVerse, StrongsDefinition, BibleSearchParams } from '@the-way/bible-engine';
// Import the interface to ensure compliance
import { IBibleRepository } from '@the-way/bible-engine';

export class BibleRepository implements IBibleRepository {
  private static instance: BibleRepository;
  private db: SQLite.SQLiteDatabase | null = null;
  private DB_NAME = 'bible.db';

  private constructor() {}

  public static getInstance(): BibleRepository {
    if (!BibleRepository.instance) {
      BibleRepository.instance = new BibleRepository();
    }
    return BibleRepository.instance;
  }

  /**
   * Initializes and returns the database connection.
   */
  public async getConnection(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) return this.db;

    const dbDir = FileSystem.documentDirectory + 'SQLite/';
    const dbPath = dbDir + this.DB_NAME;
    const fileInfo = await FileSystem.getInfoAsync(dbPath);

    if (!fileInfo.exists || (fileInfo.size && fileInfo.size < 5 * 1024 * 1024)) {
      console.log('📦 Database missing or invalid, ensuring clean copy...');
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
      }
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      const asset = Asset.fromModule(require('../assets/bible.db'));
      await asset.downloadAsync();
      await FileSystem.copyAsync({
        from: asset.localUri || asset.uri,
        to: dbPath
      });
      console.log('✅ Database copied to:', dbPath);
    }

    // @ts-ignore
    this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
    
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS database_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );
    `);

    return this.db;
  }

  // --- IBibleRepository Implementation ---

  async getBooks(): Promise<BibleBook[]> {
    const db = await this.getConnection();
    return await db.getAllAsync<BibleBook>('SELECT * FROM bible_books ORDER BY id ASC');
  }

  async getChapter(bookId: number, chapter: number): Promise<BibleVerse[]> {
    const db = await this.getConnection();
    return await db.getAllAsync<BibleVerse>(
      `SELECT v.*, b.name as book_name 
       FROM bible_verses v
       JOIN bible_books b ON v.book_id = b.id
       WHERE v.book_id = ? AND v.chapter = ? 
       ORDER BY v.verse ASC`,
      [bookId, chapter]
    );
  }

  async search(params: BibleSearchParams): Promise<BibleVerse[]> {
    const db = await this.getConnection();
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    
    return await db.getAllAsync<BibleVerse>(
      `SELECT v.*, b.name as book_name 
       FROM bible_verses v
       JOIN bible_books b ON v.book_id = b.id
       WHERE v.text LIKE ? 
       ORDER BY v.book_id, v.chapter, v.verse
       LIMIT ? OFFSET ?`,
      [`%${params.query}%`, limit, offset]
    );
  }

  async getStrongsDefinition(strongsId: string): Promise<StrongsDefinition | null> {
    const db = await this.getConnection();
    const result = await db.getAllAsync<StrongsDefinition>(
      'SELECT * FROM strongs_definitions WHERE strongs_number = ?',
      [strongsId]
    );
    return result.length > 0 ? result[0] : null;
  }

  // --- Mobile Specific Helper (Not in Interface, but needed for now) ---
  
  async getVerseText(bookName: string, chapter: number, verse: number): Promise<string | null> {
    const db = await this.getConnection();
    const result = await db.getAllAsync<{ text: string }>(
      `SELECT bv.text 
       FROM bible_verses bv
       JOIN bible_books bb ON bv.book_id = bb.id
       WHERE bb.name = ? AND bv.chapter = ? AND bv.verse = ?
       LIMIT 1`,
      [bookName, chapter, verse]
    );
    return result.length > 0 ? result[0].text : null;
  }
}
