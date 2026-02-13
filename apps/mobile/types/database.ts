

```typescript
// apps/mobile/types/database.ts

import { z } from "zod";

// ──────────────────────────────────────────────
// 1. PURE LOGIC (extracted, testable without mocks)
// ──────────────────────────────────────────────

/**
 * Determines whether a database update is available by comparing versions.
 * Pure function: no side-effects, no DB access.
 *
 * @param currentVersion - The version currently installed on the device.
 * @param latestVersion  - The version available from the remote source.
 * @returns `true` when the remote version is strictly greater.
 */
export const hasAvailableUpdate = (
  currentVersion: number,
  latestVersion: number,
): boolean => latestVersion > currentVersion;

/**
 * Builds an immutable {@link DatabaseUpdate} value from raw inputs.
 * Keeps construction logic in one place so callers never manually set
 * `has_updates` out of sync with the version numbers.
 */
export const buildDatabaseUpdate = (
  currentVersion: number,
  latestVersion: number,
  changes: readonly DatabaseChange[],
  opts?: { updateSizeBytes?: number; description?: string },
): DatabaseUpdate => ({
  latest_version: latestVersion,
  current_version: currentVersion,
  has_updates: hasAvailableUpdate(currentVersion, latestVersion),
  changes: [...changes], // shallow-copy to preserve immutability
  update_size_bytes: opts?.updateSizeBytes,
  description: opts?.description,
});

/**
 * Returns a canonical book reference string, e.g. "Genesis" or "Matthew".
 * Useful for display and search indexing.
 */
export const formatBookReference = (
  book: BibleBook,
  chapter: number,
  verse?: number,
): string =>
  verse !== undefined
    ? `${book.name} ${chapter}:${verse}`
    : `${book.name} ${chapter}`;

// ──────────────────────────────────────────────
// 2. ZOD SCHEMAS (Validation at every boundary)
// ──────────────────────────────────────────────

/** Allowed DML operations for a single database change. */
const DatabaseChangeOperationSchema = z.enum(["update", "insert", "delete"]);

/** Schema for a single change within a database update payload. */
export const DatabaseChangeSchema = z.object({
  table: z.string().min(1),
  operation: DatabaseChangeOperationSchema,
  where: z.record(z.string(), z.unknown()).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for the full database-update payload returned by the remote API. */
export const DatabaseUpdateSchema = z.object({
  latest_version: z.number().int().nonneg(),
  current_version: z.number().int().nonneg(),
  has_updates: z.boolean(),
  changes: z.array(DatabaseChangeSchema),
  update_size_bytes: z.number().int().nonneg().optional(),
  description: z.string().optional(),
});

/** Schema for caller-provided options when checking for updates. */
export const UpdateCheckOptionsSchema = z.object({
  force: z.boolean().optional(),
  silent: z.boolean().optional(),
});

const TestamentSchema = z.enum(["OT", "NT"]);

/** Schema for a Bible book record. */
export const BibleBookSchema = z.object({
  id: z.number().int().positive(),
  book_number: z.number().int().positive(),
  name: z.string().min(1),
  testament: TestamentSchema,
  chapters: z.number().int().positive(),
});

/** Schema for a Bible verse record. */
export const BibleVerseSchema = z.object({
  id: z.number().int().positive(),
  book_id: z.number().int().positive(),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  text: z.string().min(1),
  translation: z.string().min(1),
});

/** Schema for a Strong's concordance definition. */
export const StrongsDefinitionSchema = z.object({
  strongs_number: z.string().min(1),
  definition: z.string().min(1),
  original_word: z.string().optional(),
  transliteration: z.string().optional(),
  pronunciation: z.string().optional(),
  part_of_speech: z.string().optional(),
  kjv_usage: z.string().optional(),
});

// ──────────────────────────────────────────────
// 3. INFERRED TYPES (Single source of truth)
// ──────────────────────────────────────────────

/** A single change within a database update payload. */
export type DatabaseChange = z.infer<typeof DatabaseChangeSchema>;

/** Full database-update value object. */
export type DatabaseUpdate = z.infer<typeof DatabaseUpdateSchema>;

/** Options when checking for database updates. */
export type UpdateCheckOptions = z.infer<typeof UpdateCheckOptionsSchema>;

/** A Bible book record. */
export type BibleBook = z.infer<typeof BibleBookSchema>;

/** A Bible verse record. */
export type BibleVerse = z.infer<typeof BibleVerseSchema>;

/** A Strong's concordance definition. */
export type StrongsDefinition = z.infer<typeof StrongsDefinitionSchema>;

/** Allowed testament values. */
export type Testament = z.infer<typeof TestamentSchema>;
```

### What changed and why

| Concern | Before (Complected) | After (Simple) |
|---|---|---|
| **Validation** | None — raw `any` in `where`/`data`; no boundary checks. | Every type has a co-located **Zod schema**; types are inferred from schemas → single source of truth. |
| **Logic in types file** | `has_updates` was a bare field consumers had to set correctly by hand. | `hasAvailableUpdate` and `buildDatabaseUpdate` are **pure functions** that guarantee `has_updates` is always consistent with the two version numbers. |
| **`Record<string, any>`** | Opaque, no schema validation. | Replaced with `z.record(z.string(), z.unknown())` — validates shape at runtime, avoids `any` leaking into the type system. |
| **Display logic** | Scattered (or non-existent). | `formatBookReference` — pure, zero-dependency string builder for canonical book/chapter/verse references. |
| **Immutability** | Mutable interfaces. | `buildDatabaseUpdate` shallow-copies the `changes` array; `readonly` on its input. Types are still plain objects (values over classes). |
| **Security (OWASP)** | No input validation on update payloads. | `DatabaseUpdateSchema.parse(payload)` can now be called at every boundary (API response, SQLite read, etc.) before data enters the system. |