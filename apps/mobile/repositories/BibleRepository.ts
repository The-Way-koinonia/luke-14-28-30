

```typescript
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import {
  BibleBook,
  BibleVerse,
  StrongsDefinition,
  BibleSearchParams,
  IBibleRepository,
} from '@the-way/bible-engine';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Pure Logic – Extracted to top of file per constraint.
// These functions are stateless and testable without any DB or Expo mocking.
// ---------------------------------------------------------------------------

/** Minimum byte-size we consider a valid, fully-copied bible.db. */
const MIN_VALID_DB_BYTES = 5 * 1024 * 1024;

/**
 * Determines whether the local database file needs to be (re-)provisioned.
 *
 * @param exists  - Whether the file exists on disk.
 * @param sizeBytes - Size of the existing file (ignored when `exists` is false).
 * @returns `true` when the asset should be copied (fresh install or corrupt file).
 */
export const shouldProvisionDatabase = (
  exists: boolean,
  sizeBytes: number | undefined,
): boolean => {
  if (!exists) return true;
  if (sizeBytes !== undefined && sizeBytes < MIN_VALID_DB_BYTES) return true;
  return false;
};

/**
 * Clamps and defaults pagination values so SQL never receives unbounded input.
 *
 * @param limit  - Requested page size (defaults to 20, capped at 100).
 * @param offset - Requested offset (defaults to 0, floored at 0).
 */
export const normalizePagination = (
  limit: number | undefined,
  offset: number | undefined,
): { limit: number; offset: number } => {
  const safeLimit = Math.max(1, Math.min(limit ?? 20, 100));
  const safeOffset = Math.max(0, offset ?? 0);
  return { limit: safeLimit, offset: safeOffset };
};

/**
 * Sanitises a free-text search query for use in a SQL LIKE clause.
 * Escapes the LIKE meta-characters `%` and `_` that appear *inside* the
 * user-supplied string so they are matched literally, then wraps the result
 * in `%…%` for a contains-style search.
 *
 * @param raw - The raw user query string.
 * @returns A string safe to bind as a LIKE parameter.
 */
export const buildLikePattern = (raw: string): string => {
  const escaped = raw.replace(/%/g, '\\%').replace(/_/g, '\\_');
  return `%${escaped}%`;
};

// ---------------------------------------------------------------------------
// Zod Validation Schemas
// ---------------------------------------------------------------------------

/** Validates the numeric book/chapter pair coming from callers. */
const ChapterRequestSchema = z.object({
  bookId: z.number().int().positive(),
  chapter: z.number().int().positive(),
});

/** Validates search parameters. */
const SearchParamsSchema = z.object({
  query: z.string().min(1, 'Search query must not be empty'),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonneg().optional(),
});

/** Validates a Strong's number (e.g. "H1234" or "G5678"). */
const StrongsIdSchema = z
  .string()
  .regex(/^[HG]\d+$/i, 'Strong\'s ID must match H#### or G#### pattern');

/** Validates verse-text lookup parameters. */
const VerseTextRequestSchema = z.object({
  bookName: z.string().min(1),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

const DB_NAME = 'bible.db';

/**
 * SQLite-backed Bible repository for the mobile app.
 *
 * Responsibilities (Incidental Complexity only):
 *  - Manage the local database lifecycle (provision, open).
 *  - Execute parameterised queries and return typed rows.
 *
 * All domain logic is delegated to the pure functions above or to
 * `@the-way/bible-engine` service layers.
 */
export class BibleRepository implements IBibleRepository {
  private static instance: BibleRepository;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  /** Returns the singleton repository instance. */
  public static getInstance(): BibleRepository {
    if (!BibleRepository.instance) {
      BibleRepository.instance = new BibleRepository();
    }
    return BibleRepository.instance;
  }

  /**
   * Initialises (if necessary) and returns the database connection.
   *
   * The method is idempotent – subsequent calls return the cached handle.
   */
  public async getConnection(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) return this.db;

    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    const dbPath = `${dbDir}${DB_NAME}`;
    const fileInfo = await FileSystem.getInfoAsync(dbPath);

    if (shouldProvisionDatabase(fileInfo.exists, fileInfo.size)) {
      console.log('📦 Database missing or invalid, ensuring clean copy…');

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
      }

      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });

      const asset = Asset.fromModule(require('../assets/bible.db'));
      await asset.downloadAsync();

      const sourceUri = asset.localUri ?? asset.uri;
      if (!sourceUri) {
        throw new Error('Failed to resolve local URI for bundled bible.db asset.');
      }

      await FileSystem.copyAsync({ from: sourceUri, to: dbPath });
      console.log('✅ Database copied to:', dbPath);
    }

    // @ts-expect-error – expo-sqlite typings lag behind the async API surface
    this.db = await SQLite.openDatabaseAsync(DB_NAME);

    await this.db!.execAsync(`
      CREATE TABLE IF NOT EXISTS database_metadata (
        key   TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );
    `);

    return this.db!;
  }

  // --- IBibleRepository Implementation ---

  /** Retrieves all Bible books ordered by canonical id. */
  async getBooks(): Promise<BibleBook[]> {
    const db = await this.getConnection();
    return db.getAllAsync<BibleBook>(
      'SELECT * FROM bible_books ORDER BY id ASC',
    );
  }

  /** Retrieves every verse in a given chapter, including the parent book name. */
  async getChapter(bookId: number, chapter: number): Promise<BibleVerse[]> {
    const validated = ChapterRequestSchema.parse({ bookId, chapter });
    const db = await this.getConnection();

    return db.getAllAsync<BibleVerse>(
      `SELECT v.*, b.name AS book_name
         FROM bible_verses v
         JOIN bible_books b ON v.book_id = b.id
        WHERE v.book_id = ?
          AND v.chapter  = ?
        ORDER BY v.verse ASC`,
      [validated.bookId, validated.chapter],
    );
  }

  /**
   * Full-text search across all verses.
   *
   * LIKE meta-characters inside the user query are escaped so they match
   * literally; pagination is clamped to safe bounds.
   */
  async search(params: BibleSearchParams): Promise<BibleVerse[]> {
    const validated = SearchParamsSchema.parse(params);
    const { limit, offset } = normalizePagination(validated.limit, validated.offset);
    const likePattern = buildLikePattern(validated.query);

    const db = await this.getConnection();

    return db.getAllAsync<BibleVerse>(
      `SELECT v.*, b.name AS book_name
         FROM bible_verses v
         JOIN bible_books b ON v.book_id = b.id
        WHERE v.text LIKE ? ESCAPE '\\'
        ORDER BY v.book_id, v.chapter, v.verse
        LIMIT ? OFFSET ?`,
      [likePattern, limit, offset],
    );
  }

  /** Looks up a single Strong's Concordance definition by number. */
  async getStrongsDefinition(
    strongsId: string,
  ): Promise<StrongsDefinition | null> {
    const validated = StrongsIdSchema.parse(strongsId);
    const db = await this.getConnection();

    const result = await db.getAllAsync<StrongsDefinition>(
      'SELECT * FROM strongs_definitions WHERE strongs_number = ?',
      [validated],
    );

    return result.length > 0 ? result[0] : null;
  }

  // --- Mobile-Specific Helper (not in IBibleRepository) ---

  /**
   * Retrieves the raw text for a single verse identified by book name,
   * chapter, and verse number.
   *
   * @returns The verse text, or `null` if no matching row exists.
   */
  async getVerseText(
    bookName: string,
    chapter: number,
    verse: number,
  ): Promise<string | null> {
    const validated = VerseTextRequestSchema.parse({ bookName, chapter, verse });
    const db = await this.getConnection();

    const result = await db.getAllAsync<{ text: string }>(
      `SELECT bv.text
         FROM bible_verses bv
         JOIN bible_books  bb ON bv.book_id = bb.id
        WHERE bb.name    = ?
          AND bv.chapter = ?
          AND bv.verse   = ?
        LIMIT 1`,
      [validated.bookName, validated.chapter, validated.verse],
    );

    return result.length > 0 ? result[0].text : null;
  }
}
```

### What changed and why

| Concern | Before | After | Rationale |
|---|---|---|---|
| **Pure logic extraction** | `shouldProvision` check was inline in `getConnection` | `shouldProvisionDatabase()`, `normalizePagination()`, `buildLikePattern()` are **exported pure functions** at file top | De-complects decision logic from IO; each is testable in plain Node without Expo mocking |
| **Input validation (OWASP / Zod)** | No validation at the public boundary | Every public method validates arguments via a Zod schema before touching SQLite | Prevents malformed/malicious input from reaching the DB; typed errors propagate to callers |
| **SQL injection via LIKE wildcards** | `%${params.query}%` — user-supplied `%` and `_` altered query semantics | `buildLikePattern` escapes LIKE meta-chars; query uses `ESCAPE '\\'` | Closes a real injection/DoS vector (e.g. `%%%%` bypasses intended filtering) |
| **Pagination bounds** | Raw `params.limit ‖ 20` with no upper cap | `normalizePagination` clamps limit to `[1, 100]` and offset to `≥ 0` | Prevents accidental full-table scans or negative offsets |
| **Null-safety on asset URI** | `asset.localUri ‖ asset.uri` with no guard | Explicit `if (!sourceUri) throw` | Fails fast with a clear message instead of a cryptic `FileSystem.copyAsync` error |
| **TSDoc** | Sparse/missing | Every exported function and public method documented | Matches the Documentation protocol |
| **`@ts-ignore` → `@ts-expect-error`** | `@ts-ignore` silently swallows *any* error | `@ts-expect-error` will surface if the underlying type issue is fixed | Safer suppression; alerts devs when it's no longer needed |