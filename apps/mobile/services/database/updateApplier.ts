

```typescript
import * as SQLite from 'expo-sqlite';
import { z } from 'zod';
import { DatabaseChange } from '../../types/database';

// ---------------------------------------------------------------------------
// 🔒 ALLOWLIST: Only these tables & columns may be touched by the applier.
//    This is the primary defense against SQL injection via dynamic identifiers.
// ---------------------------------------------------------------------------

const ALLOWED_TABLES: ReadonlySet<string> = new Set([
  'users',
  'profiles',
  'reading_plans',
  'reading_progress',
  'verses',
  'bookmarks',
  'highlights',
  'notes',
  'social_posts',
  'social_comments',
  'social_likes',
  'friendships',
  'memory_cards',
  'memory_reviews',
  'notifications',
  'settings',
]);

const ALLOWED_COLUMN_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

// ---------------------------------------------------------------------------
// 🧩 PURE LOGIC — Extracted validation & SQL construction (no DB dependency)
// ---------------------------------------------------------------------------

/** Typed, discriminated result of validating + building SQL for a change. */
export type SqlStatement = { sql: string; params: unknown[] };

export class ChangeValidationError extends Error {
  constructor(message: string, public readonly change: DatabaseChange) {
    super(message);
    this.name = 'ChangeValidationError';
  }
}

/**
 * Validates a table name against the allowlist.
 * @throws {ChangeValidationError} if the table is not allowed.
 */
function assertAllowedTable(table: string, change: DatabaseChange): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new ChangeValidationError(
      `Table "${table}" is not in the allowlist. Refusing to apply change.`,
      change,
    );
  }
}

/**
 * Validates that every key in `record` is a safe, lowercase column identifier.
 * @throws {ChangeValidationError} on the first invalid column name.
 */
function assertSafeColumns(
  record: Record<string, unknown>,
  context: string,
  change: DatabaseChange,
): void {
  for (const key of Object.keys(record)) {
    if (!ALLOWED_COLUMN_PATTERN.test(key)) {
      throw new ChangeValidationError(
        `Unsafe column identifier "${key}" in ${context}. Must match ${ALLOWED_COLUMN_PATTERN}.`,
        change,
      );
    }
  }
}

/**
 * Builds a parameterised UPDATE statement from a validated change.
 * Pure function — no side-effects.
 */
export function buildUpdateSql(change: DatabaseChange): SqlStatement {
  const { table, data, where } = change;

  if (!where || Object.keys(where).length === 0) {
    throw new ChangeValidationError('Invalid update change — missing or empty "where".', change);
  }
  if (!data || Object.keys(data).length === 0) {
    throw new ChangeValidationError('Invalid update change — missing or empty "data".', change);
  }

  assertAllowedTable(table, change);
  assertSafeColumns(data, 'SET clause', change);
  assertSafeColumns(where, 'WHERE clause', change);

  const setKeys = Object.keys(data);
  const setClause = setKeys.map((k) => `"${k}" = ?`).join(', ');
  const setValues = setKeys.map((k) => data[k]);

  const whereKeys = Object.keys(where);
  const whereClause = whereKeys.map((k) => `"${k}" = ?`).join(' AND ');
  const whereValues = whereKeys.map((k) => where[k]);

  return {
    sql: `UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`,
    params: [...setValues, ...whereValues],
  };
}

/**
 * Builds a parameterised INSERT OR REPLACE statement from a validated change.
 * Pure function — no side-effects.
 */
export function buildInsertSql(change: DatabaseChange): SqlStatement {
  const { table, data } = change;

  if (!data || Object.keys(data).length === 0) {
    throw new ChangeValidationError('Invalid insert change — missing or empty "data".', change);
  }

  assertAllowedTable(table, change);
  assertSafeColumns(data, 'INSERT columns', change);

  const keys = Object.keys(data);
  const columns = keys.map((k) => `"${k}"`).join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  const values = keys.map((k) => data[k]);

  return {
    sql: `INSERT OR REPLACE INTO "${table}" (${columns}) VALUES (${placeholders})`,
    params: values,
  };
}

/**
 * Builds a parameterised DELETE statement from a validated change.
 * Pure function — no side-effects.
 */
export function buildDeleteSql(change: DatabaseChange): SqlStatement {
  const { table, where } = change;

  if (!where || Object.keys(where).length === 0) {
    throw new ChangeValidationError('Invalid delete change — missing or empty "where".', change);
  }

  assertAllowedTable(table, change);
  assertSafeColumns(where, 'WHERE clause', change);

  const whereKeys = Object.keys(where);
  const whereClause = whereKeys.map((k) => `"${k}" = ?`).join(' AND ');
  const whereValues = whereKeys.map((k) => where[k]);

  return {
    sql: `DELETE FROM "${table}" WHERE ${whereClause}`,
    params: whereValues,
  };
}

/**
 * Routes a `DatabaseChange` to the correct SQL builder.
 * Pure function — returns the statement without executing it.
 *
 * @throws {ChangeValidationError} for unknown operations or invalid data.
 */
export function buildSqlForChange(change: DatabaseChange): SqlStatement {
  switch (change.operation) {
    case 'update':
      return buildUpdateSql(change);
    case 'insert':
      return buildInsertSql(change);
    case 'delete':
      return buildDeleteSql(change);
    default:
      throw new ChangeValidationError(
        `Unknown operation type: "${(change as any).operation}"`,
        change,
      );
  }
}

// ---------------------------------------------------------------------------
// 🗄️ REPOSITORY LAYER — Thin wrapper that touches the database
// ---------------------------------------------------------------------------

/**
 * Applies a single {@link DatabaseChange} against the given SQLite database.
 *
 * 1. Validates & builds SQL via pure helpers (no DB access).
 * 2. Executes the resulting parameterised statement.
 *
 * @throws {ChangeValidationError} if the change is malformed or targets a
 *   disallowed table / column.
 */
export async function applyDatabaseChange(
  db: SQLite.SQLiteDatabase,
  change: DatabaseChange,
): Promise<void> {
  const { sql, params } = buildSqlForChange(change);
  await db.runAsync(sql, params);
}
```

### What changed and why

| Concern | Before | After |
|---|---|---|
| **SQL Injection via identifiers** | Table & column names were interpolated raw (`\`UPDATE ${change.table}\``). An attacker-controlled `change.table` of `"users; DROP TABLE users--"` would execute arbitrary SQL. | Table names are checked against an **allowlist** (`ALLOWED_TABLES`). Column names are validated with a strict regex. Both are additionally **double-quoted** (`"col"`) to prevent syntax escape. |
| **Logic ↔ DB complecting** | Validation, SQL building, and execution were tangled inside one async function per operation. | Pure **`build*Sql`** functions produce `{ sql, params }` — testable in a plain Node script with zero mocking. The single `applyDatabaseChange` entry point is now a thin repository call. |
| **Silent failures** | `console.warn` swallowed invalid changes; callers had no idea the write was skipped. | Throws a typed **`ChangeValidationError`** so callers (sync engine, UI) can catch and surface the problem or retry. |
| **Unknown operations** | Silently warned and continued. | Throws, making exhaustiveness explicit. |
| **Deterministic column ordering** | `Object.keys` + `Object.values` called separately — technically safe today but fragile. | Keys are iterated once; values are mapped from the same key array, guaranteeing order. |