

```typescript
import { BibleRepository } from '../repositories/BibleRepository';
import {
  EngineBibleService,
  BibleBook,
  BibleVerse,
  StrongsDefinition,
} from '@the-way/bible-engine';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// PURE LOGIC (extracted, no I/O, testable in plain Node.js)
// ─────────────────────────────────────────────────────────────

/**
 * Canonical mapping from 3-letter USFM book codes to human-readable names.
 * Extend as the full canon is onboarded.
 */
const BOOK_CODE_MAP: Readonly<Record<string, string>> = Object.freeze({
  GEN: 'Genesis',
  EXO: 'Exodus',
  PSA: 'Psalms',
  MAT: 'Matthew',
  MRK: 'Mark',
  LUK: 'Luke',
  JHN: 'John',
  ACT: 'Acts',
  ROM: 'Romans',
});

/** Zod schema that validates a "BOOK.chapter.verse" reference string. */
const VerseRefSchema = z
  .string()
  .regex(
    /^[A-Z]{3}\.\d+\.\d+$/,
    'Reference must match format "ABC.1.1" (3-letter book code, chapter, verse)',
  );

/** The structured result of parsing a verse reference string. */
export interface ParsedVerseRef {
  bookCode: string;
  bookName: string;
  chapter: number;
  verse: number;
}

/**
 * Parses a dot-delimited verse reference (e.g. "JHN.3.16") into its
 * constituent, validated parts.
 *
 * @pure — no I/O, no side-effects.
 * @returns A `ParsedVerseRef` on success, or a descriptive error string.
 */
export function parseVerseRef(
  ref: string,
): { ok: true; value: ParsedVerseRef } | { ok: false; error: string } {
  const validation = VerseRefSchema.safeParse(ref);
  if (!validation.success) {
    return { ok: false, error: validation.error.issues[0].message };
  }

  const [bookCode, chapterStr, verseStr] = validation.data.split('.');
  const chapter = parseInt(chapterStr, 10);
  const verse = parseInt(verseStr, 10);

  const bookName = BOOK_CODE_MAP[bookCode];
  if (!bookName) {
    return { ok: false, error: `Unknown book code: ${bookCode}` };
  }

  return { ok: true, value: { bookCode, bookName, chapter, verse } };
}

/**
 * Validates a Strong's ID format (e.g. "H1234" or "G5678").
 *
 * @pure
 */
const StrongsIdSchema = z
  .string()
  .regex(/^[HG]\d{1,5}$/, 'Strong\'s ID must match "H1234" or "G5678"');

// ─────────────────────────────────────────────────────────────
// SERVICE (orchestration — thin layer over engine + repository)
// ─────────────────────────────────────────────────────────────

// Initialize the Engine Service with the Mobile Repository (singleton)
const repository = BibleRepository.getInstance();
const engineService = new EngineBibleService(repository);

export class BibleService {
  /**
   * Retrieves all books of the Bible.
   */
  static async getBooks(): Promise<BibleBook[]> {
    return engineService.getBooks();
  }

  /**
   * Retrieves all formatted verses for a specific chapter.
   *
   * @param bookId - Numeric book identifier (1-66).
   * @param chapter - 1-based chapter number.
   */
  static async getChapter(
    bookId: number,
    chapter: number,
  ): Promise<BibleVerse[]> {
    const validated = z
      .object({
        bookId: z.number().int().min(1).max(66),
        chapter: z.number().int().min(1),
      })
      .parse({ bookId, chapter });

    return engineService.getFormattedChapter(
      validated.bookId,
      validated.chapter,
    );
  }

  /**
   * Gets a specific Strong's word definition.
   *
   * @param strongsId - A Strong's concordance ID (e.g. "H1234", "G5678").
   */
  static async getStrongsDefinition(
    strongsId: string,
  ): Promise<StrongsDefinition | null> {
    const validated = StrongsIdSchema.parse(strongsId);
    return engineService.getStrongsDefinition(validated);
  }

  /**
   * Parses a dot-delimited reference (e.g. "JHN.3.16") and fetches the
   * corresponding verse text from the local database.
   *
   * Delegates parsing to the pure `parseVerseRef` function, then calls
   * the repository for data access.
   *
   * @param ref - A reference string in "BOOK.chapter.verse" format.
   * @returns The verse text, a human-readable error string, or `null`.
   */
  static async getVerseText(ref: string): Promise<string | null> {
    const result = parseVerseRef(ref);

    if (!result.ok) {
      return `[${result.error}]`;
    }

    const { bookName, chapter, verse } = result.value;
    return repository.getVerseText(bookName, chapter, verse);
  }
}
```

### What changed and why

| Concern | Before (Complected) | After (Simple) |
|---|---|---|
| **Reference parsing** | Inline imperative logic inside `getVerseText` — untestable without the repository | Extracted to **`parseVerseRef`**, a pure function returning a discriminated union. Testable with zero mocks. |
| **Book code mapping** | Mutable `Record` literal created on every call | `BOOK_CODE_MAP` — a module-level `Object.freeze`'d constant (value, not state). |
| **Input validation** | Manual `split` + length check; no validation on `strongsId` or `getChapter` args | **Zod schemas** (`VerseRefSchema`, `StrongsIdSchema`, inline object schema) enforce contracts at every public boundary per the Security Protocol. |
| **Error semantics** | `null` for both "bad input" and "not found" — ambiguous | `parseVerseRef` returns `{ ok, error }` discriminated union; callers can distinguish bad refs from missing data. |
| **TSDoc** | Minimal | Every exported function and public method documented per the Documentation protocol. |