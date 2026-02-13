

```typescript
import * as SQLite from 'expo-sqlite';
import { BibleRepository } from './BibleRepository';

// ---------------------------------------------------------------------------
// Pure Logic (extracted, testable without DB)
// ---------------------------------------------------------------------------

/** Extracts the first value from a metadata query result, or null if empty. */
export const extractMetadataValue = (
  rows: ReadonlyArray<{ value: string }>
): string | null => {
  return rows.length > 0 ? rows[0].value : null;
};

/** Builds the parameter tuple for an upsert operation. */
export const buildUpsertParams = (
  key: string,
  value: string,
  now: string
): [string, string, string] => [key, value, now];

// ---------------------------------------------------------------------------
// Repository (data-access only – incidental complexity)
// ---------------------------------------------------------------------------

const TABLE = 'database_metadata' as const;

const SQL_SELECT_VALUE = `SELECT value FROM ${TABLE} WHERE key = ?` as const;
const SQL_UPSERT_VALUE =
  `INSERT OR REPLACE INTO ${TABLE} (key, value, updated_at) VALUES (?, ?, ?)` as const;

/**
 * Repository responsible for reading and writing key-value metadata
 * stored in the local SQLite `database_metadata` table.
 *
 * All SQL uses parameterized queries (OWASP).
 */
export class MetadataRepository {
  /**
   * Returns the open SQLite connection managed by {@link BibleRepository}.
   */
  static async getConnection(): Promise<SQLite.SQLiteDatabase> {
    return BibleRepository.getInstance().getConnection();
  }

  /**
   * Retrieve a single metadata value by its key.
   *
   * @param key - The metadata key to look up.
   * @returns The stored value, or `null` if the key does not exist.
   */
  static async getValue(key: string): Promise<string | null> {
    const db = await this.getConnection();
    const rows = await db.getAllAsync<{ value: string }>(SQL_SELECT_VALUE, [
      key,
    ]);
    return extractMetadataValue(rows);
  }

  /**
   * Insert or replace a metadata key-value pair.
   *
   * @param key   - The metadata key.
   * @param value - The value to persist.
   * @param now   - Optional ISO-8601 timestamp; defaults to `new Date().toISOString()`.
   */
  static async setValue(
    key: string,
    value: string,
    now: string = new Date().toISOString()
  ): Promise<void> {
    const db = await this.getConnection();
    await db.runAsync(SQL_UPSERT_VALUE, buildUpsertParams(key, value, now));
  }
}
```

### What changed and why

| Concern | Before | After |
|---|---|---|
| **Pure logic mixed with DB** | `result.length > 0 ? result[0].value : null` lived inside an `async` DB method — untestable without a DB. | Extracted to `extractMetadataValue` — a pure function testable in plain Node. |
| **Timestamp creation buried in SQL call** | `new Date().toISOString()` was inlined, making the write non-deterministic and harder to test. | `now` is an injectable parameter (defaults to current time); `buildUpsertParams` is a pure function that assembles the tuple. |
| **SQL string safety** | Template literal `${this.TABLE}` re-evaluated on every call (low risk but unnecessary indirection). | `TABLE`, `SQL_SELECT_VALUE`, and `SQL_UPSERT_VALUE` are module-level `const` strings — no runtime interpolation, still parameterized for user inputs. |
| **TSDoc** | None. | Every exported function and public method is documented. |
| **Immutable data preference** | Parameter typed as mutable array. | `extractMetadataValue` accepts `ReadonlyArray`; `buildUpsertParams` returns a typed tuple. |