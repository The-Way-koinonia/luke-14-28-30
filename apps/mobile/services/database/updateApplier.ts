import * as SQLite from 'expo-sqlite';
import { DatabaseChange } from '../../types/database';

/**
 * Applies a single database change within a transaction
 */
export async function applyDatabaseChange(
  db: SQLite.SQLiteDatabase,
  change: DatabaseChange
): Promise<void> {
  switch (change.operation) {
    case 'update':
      await applyUpdate(db, change);
      break;
      
    case 'insert':
      await applyInsert(db, change);
      break;
      
    case 'delete':
      await applyDelete(db, change);
      break;
      
    default:
      console.warn(`Unknown operation type: ${change.operation}`);
  }
}

async function applyUpdate(db: SQLite.SQLiteDatabase, change: DatabaseChange): Promise<void> {
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
  
  const sql = `UPDATE ${change.table} SET ${setClause} WHERE ${whereClause}`;
  
  await db.runAsync(sql, [...setValues, ...whereValues]);
}

async function applyInsert(db: SQLite.SQLiteDatabase, change: DatabaseChange): Promise<void> {
  if (!change.data) {
    console.warn('Invalid insert change - missing data');
    return;
  }
  
  const insertKeys = Object.keys(change.data);
  const insertPlaceholders = insertKeys.map(() => '?').join(', ');
  const insertValues = Object.values(change.data);
  
  const sql = `INSERT OR REPLACE INTO ${change.table} (${insertKeys.join(', ')}) VALUES (${insertPlaceholders})`;
  
  await db.runAsync(sql, insertValues);
}

async function applyDelete(db: SQLite.SQLiteDatabase, change: DatabaseChange): Promise<void> {
  if (!change.where) {
    console.warn('Invalid delete change - missing where clause');
    return;
  }
  
  const deleteKeys = Object.keys(change.where);
  const deleteClause = deleteKeys.map(k => `${k} = ?`).join(' AND ');
  const deleteValues = Object.values(change.where);
  
  const sql = `DELETE FROM ${change.table} WHERE ${deleteClause}`;
  
  await db.runAsync(sql, deleteValues);
}
