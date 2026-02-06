import * as SQLite from 'expo-sqlite';
import { BibleBook, BibleVerse } from '@/types/database';

// Open the database (assuming it's in assets and moved to DocumentDir by expo-sqlite or manually)
// Using synchronous open for simplicity with expo-sqlite legacy/compat or async with new API.
// We'll use the safe async open if available or standard openDatabase.
// Note: If using Expo SDK 50+, useSQLiteContext is preferred but for a utility we might just open it.

let db: SQLite.SQLiteDatabase | null = null;

// Export getDb so services can use it
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

export const getDb = async () => {
  if (db) return db;

  // Ensure the database file exists in the Document directory
  const dbName = 'bible.db';
  const dbDir = FileSystem.documentDirectory + 'SQLite/';
  const dbPath = dbDir + dbName;

  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  
  // If file doesn't exist OR is too small (incomplete/corrupt/empty db from previous runs)
  // The full bible.db is ~40MB. An empty sqlite file is < 100KB.
  if (!fileInfo.exists || (fileInfo.size && fileInfo.size < 5 * 1024 * 1024)) {
    console.log('📦 Database missing or invalid, ensuring clean copy...');
    
    // Close existing connection if any (though db var is null here)
    if (fileInfo.exists) {
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
    }

    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    
    // Load asset - Assuming the asset is bundled properly. 
    // For Expo Router / standard expo structure:
    const asset = Asset.fromModule(require('../assets/bible.db'));
    await asset.downloadAsync();
    
    await FileSystem.copyAsync({
      from: asset.localUri || asset.uri,
      to: dbPath
    });
    console.log('✅ Database copied to:', dbPath);
  }

  // @ts-ignore
  db = await SQLite.openDatabaseAsync(dbName);
  
  // Initialize schema (create metadata if missing, but table structure should be in asset)
  await initDatabase(db);
  
  return db;
};

export const getBooks = async (): Promise<BibleBook[]> => {
  const db = await getDb();
  // Using 'id' as it maps to the canonical book order (1=Genesis, etc.)
  return await db.getAllAsync<BibleBook>('SELECT * FROM bible_books ORDER BY id ASC');
};

export const getChapterVerses = async (bookId: number, chapter: number): Promise<BibleVerse[]> => {
  const db = await getDb();
  return await db.getAllAsync<BibleVerse>(
    `SELECT * FROM bible_verses 
     WHERE book_id = ? AND chapter = ? 
     ORDER BY verse ASC`,
    [bookId, chapter]
  );
};

export const getStrongsDefinition = async (strongsId: string): Promise<import('@/types/database').StrongsDefinition | null> => {
    try {
        const db = await getDb();
        const result = await db.getAllAsync<import('@/types/database').StrongsDefinition>(
            'SELECT * FROM strongs_definitions WHERE strongs_number = ?',
            [strongsId]
        );
        return result.length > 0 ? result[0] : null;
    } catch (e) {
        console.error("❌ getStrongsDefinition failed:", e);
        return null;
    }
};

const initDatabase = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS database_metadata (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );
  `);
};

/**
 * Parses a verse reference like "JHN.3.16" into components.
 */
export const parseVerseRef = (ref: string) => {
  const parts = ref.split('.');
  if (parts.length < 3) return null;
  return {
    bookCode: parts[0], // e.g., "JHN"
    chapter: parseInt(parts[1], 10),
    verse: parseInt(parts[2], 10),
  };
};

/**
 * Fetches the text for a given verse reference.
 */
export const getVerseText = async (verseRef: string): Promise<string | null> => {
  try {
    const database = await getDb();
    const parsed = parseVerseRef(verseRef);
    if (!parsed) return null;

    // We need to map "JHN" to book_id or name.
    // Assuming we can join on book name if we knew the mapping.
    // For this MVP, let's assume we can look up by a mapping or fuzzy match if tables exist.
    // Given the schema in build-mobile-db.js:
    // bible_books (id, name, testament)
    // bible_verses (book_id, chapter, verse, text)

    // Rough mapping for demo (expand as needed or fetch dynamic mapping)
    const bookMap: Record<string, string> = {
        'JHN': 'John',
        'GEN': 'Genesis',
        'EXO': 'Exodus',
        'PSA': 'Psalms', // or Psalm
        'MAT': 'Matthew',
        'MRK': 'Mark',
        'LUK': 'Luke',
        'ACT': 'Acts',
        'ROM': 'Romans',
        // ... add others
    };

    const bookName = bookMap[parsed.bookCode];
    if (!bookName) return `[Unknown Book Code: ${parsed.bookCode}]`;

    const result = await database.getAllAsync<{ text: string }>(
      `SELECT bv.text 
       FROM bible_verses bv
       JOIN bible_books bb ON bv.book_id = bb.id
       WHERE bb.name = ? AND bv.chapter = ? AND bv.verse = ?
       LIMIT 1`,
      [bookName, parsed.chapter, parsed.verse]
    );

    if (result && result.length > 0) {
      return result[0].text;
    }
    return null;
  } catch (error) {
    console.error('Error fetching verse:', error);
    return null;
  }
};

// End of file

