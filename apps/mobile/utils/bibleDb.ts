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

import { DatabaseUpdate, DatabaseChange } from '@the-way/types';
import { API_BASE_URL } from '@/constants/config';

interface UpdateCheckOptions {
  force?: boolean; // Bypass cooldown period
  silent?: boolean; // Don't show UI notifications
}

export const checkForDatabaseUpdates = async (options: UpdateCheckOptions = {}): Promise<void> => {
  try {
    const database = await getDb();
    
    // Don't check too frequently - only once per day unless forced
    if (!options.force) {
      const lastCheck = await database.getAllAsync<{ value: string }>(
        'SELECT value FROM database_metadata WHERE key = ?',
        ['last_update_check']
      );
      
      if (lastCheck && lastCheck.length > 0) {
        const lastCheckDate = new Date(lastCheck[0].value);
        const hoursSinceLastCheck = 
          (Date.now() - lastCheckDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastCheck < 24) {
          console.log('Skipping update check - last checked recently');
          return;
        }
      }
    }
    
    // Update last check timestamp
    await database.runAsync(
      'INSERT OR REPLACE INTO database_metadata (key, value, updated_at) VALUES (?, ?, ?)',
      ['last_update_check', new Date().toISOString(), new Date().toISOString()]
    );
    
    // Get current version
    const versionRow = await database.getAllAsync<{ value: string }>(
      'SELECT value FROM database_metadata WHERE key = ?',
      ['data_version']
    );
    const currentVersion = versionRow && versionRow.length > 0 ? parseInt(versionRow[0].value, 10) : 1;
    
    // Check for updates from server
    // Note: Add auth header if available. For now assuming public/open or handled by interceptor.
    const response = await fetch(
      `${API_BASE_URL}/database/updates?current_version=${currentVersion}`,
      {
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}` // Add auth if needed
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Update check failed: ${response.status}`);
    }
    
    const updateData: DatabaseUpdate = await response.json();
    
    if (!updateData.has_updates || updateData.changes.length === 0) {
      console.log('Database is up to date');
      return;
    }
    
    console.log(`Applying ${updateData.changes.length} database updates...`);
    
    // Apply all changes in a single transaction
    await database.withTransactionAsync(async () => {
        for (const change of updateData.changes) {
            await applyDatabaseChange(database, change);
        }
        
        // Update version number
        await database.runAsync(
            'INSERT OR REPLACE INTO database_metadata (key, value, updated_at) VALUES (?, ?, ?)',
            ['data_version', updateData.latest_version.toString(), new Date().toISOString()]
        );
    });
    
    console.log(`Database updated successfully to version ${updateData.latest_version}`);
    
    if (!options.silent) {
       // TODO: Use a proper toast/notification system
       console.log('Bible data updated with latest improvements');
    }
    
  } catch (error) {
    console.error('Failed to check for database updates:', error);
    // Don't throw - update failures shouldn't block app usage
  }
};

async function applyDatabaseChange(db: SQLite.SQLiteDatabase, change: DatabaseChange): Promise<void> {
  switch (change.operation) {
    case 'update':
      if (!change.where || !change.data) {
        console.warn('Invalid update change - missing where or data');
        return;
      }
      
      // Build WHERE clause
      const whereKeys = Object.keys(change.where);
      const whereClause = whereKeys.map(k => `${k} = ?`).join(' AND ');
      const whereValues = Object.values(change.where);
      
      // Build SET clause
      const setKeys = Object.keys(change.data);
      const setClause = setKeys.map(k => `${k} = ?`).join(', ');
      const setValues = Object.values(change.data);
      
      await db.runAsync(
        `UPDATE ${change.table} SET ${setClause} WHERE ${whereClause}`,
        [...setValues, ...whereValues]
      );
      break;
      
    case 'insert':
      if (!change.data) {
        console.warn('Invalid insert change - missing data');
        return;
      }
      
      const insertKeys = Object.keys(change.data);
      const insertPlaceholders = insertKeys.map(() => '?').join(', ');
      const insertValues = Object.values(change.data);
      
      await db.runAsync(
        `INSERT OR REPLACE INTO ${change.table} (${insertKeys.join(', ')}) VALUES (${insertPlaceholders})`,
        insertValues
      );
      break;
      
    case 'delete':
      if (!change.where) {
        console.warn('Invalid delete change - missing where clause');
        return;
      }
      
      const deleteKeys = Object.keys(change.where);
      const deleteClause = deleteKeys.map(k => `${k} = ?`).join(' AND ');
      const deleteValues = Object.values(change.where);
      
      await db.runAsync(
        `DELETE FROM ${change.table} WHERE ${deleteClause}`,
        deleteValues
      );
      break;
      
    default:
      console.warn(`Unknown operation type: ${(change as any).operation}`);
  }
}
