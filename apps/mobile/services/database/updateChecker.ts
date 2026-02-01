import { DatabaseUpdate, UpdateCheckOptions } from '../../types/database';
import { applyDatabaseChange } from './updateApplier';
import { getDb as getDatabase } from '../../utils/bibleDb';
import { API_BASE_URL } from '@/constants/config';
import * as SQLite from 'expo-sqlite';

const COOLDOWN_HOURS = 24; // Check at most once per day

/**
 * Checks for and applies database updates from the server
 */
export async function checkForDatabaseUpdates(
  options: UpdateCheckOptions = {}
): Promise<void> {
  try {
    const db = await getDatabase();
    
    // Don't check too frequently unless forced
    if (!options.force) {
      const shouldSkip = await shouldSkipUpdateCheck(db);
      if (shouldSkip) {
        console.log('[DB Updates] Skipping - checked recently');
        return;
      }
    }
    
    // Update last check timestamp
    await updateLastCheckTime(db);
    
    // Get current database version
    const currentVersion = await getCurrentVersion(db);
    console.log(`[DB Updates] Current version: ${currentVersion}`);
    
    // Fetch available updates from server
    // TODO: Add auth token if needed
    const authToken = ''; 
    const updateData = await fetchUpdates(currentVersion, authToken);
    
    if (!updateData.has_updates || updateData.changes.length === 0) {
      console.log('[DB Updates] Database is up to date');
      return;
    }
    
    console.log(`[DB Updates] Applying ${updateData.changes.length} changes...`);
    
    // Apply all changes in a single transaction
    await db.withTransactionAsync(async () => {
      for (const change of updateData.changes) {
        await applyDatabaseChange(db, change);
      }
      
      // Update version number
      await db.runAsync(
        `INSERT OR REPLACE INTO database_metadata (key, value, updated_at) 
         VALUES (?, ?, ?)`,
        ['data_version', updateData.latest_version.toString(), new Date().toISOString()]
      );
    });
    
    console.log(`[DB Updates] Successfully updated to version ${updateData.latest_version}`);
    
    if (!options.silent) {
      // Show toast/notification to user
      showUpdateNotification(updateData.description);
    }
    
  } catch (error) {
    console.error('[DB Updates] Failed to check for updates:', error);
    // Don't throw - update failures shouldn't block app usage
  }
}

/**
 * Check if we should skip update check based on cooldown
 */
async function shouldSkipUpdateCheck(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    const result = await db.getAllAsync<{ value: string }>(
      'SELECT value FROM database_metadata WHERE key = ?',
      ['last_update_check']
    );
    
    if (!result || result.length === 0) return false;
    
    const lastCheck = new Date(result[0].value);
    const hoursSince = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60);
    
    return hoursSince < COOLDOWN_HOURS;
  } catch (error) {
    console.error('[DB Updates] Error checking last update time:', error);
    return false;
  }
}

/**
 * Update the last check timestamp
 */
async function updateLastCheckTime(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO database_metadata (key, value, updated_at) 
     VALUES (?, ?, ?)`,
    ['last_update_check', new Date().toISOString(), new Date().toISOString()]
  );
}

/**
 * Get current database version
 */
async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getAllAsync<{ value: string }>(
      'SELECT value FROM database_metadata WHERE key = ?',
      ['data_version']
    );
    
    return result && result.length > 0 ? parseInt(result[0].value, 10) : 1;
  } catch (error) {
    console.error('[DB Updates] Error getting current version:', error);
    return 1;
  }
}

/**
 * Fetch updates from the API
 */
async function fetchUpdates(
  currentVersion: number,
  authToken: string
): Promise<DatabaseUpdate> {
  const url = `${API_BASE_URL}/database/updates?current_version=${currentVersion}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    headers: headers,
    // Timeout after 10 seconds (using AbortSignal.timeout if supported, else assume fetch handles it or use workaround)
    // React Native/Expo might typically support AbortSignal
    signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined, 
  });
  
  if (!response.ok) {
    throw new Error(`Update check failed: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Show notification to user about the update
 */
function showUpdateNotification(description?: string): void {
  // Console log for now, can be replaced with real Toast or Alert
  console.log('[DB Updates] Showing notification:', description);
}
