import * as SQLite from 'expo-sqlite';

// Open the database (assuming it's in assets and moved to DocumentDir by expo-sqlite or manually)
// Using synchronous open for simplicity with expo-sqlite legacy/compat or async with new API.
// We'll use the safe async open if available or standard openDatabase.
// Note: If using Expo SDK 50+, useSQLiteContext is preferred but for a utility we might just open it.

let db: SQLite.SQLiteDatabase | null = null;

const getDb = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('bible.db');
  return db;
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
