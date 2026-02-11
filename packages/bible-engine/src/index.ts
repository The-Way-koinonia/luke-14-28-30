import { BibleBook, BibleVerse, StrongsDefinition, BibleSearchParams } from './types';

export interface BibleEngine {
  /**
   * Get all books in the Bible.
   */
  getBooks(): Promise<BibleBook[]>;

  /**
   * Get verses for a specific chapter.
   */
  getChapterVerses(bookId: number, chapter: number): Promise<BibleVerse[]>;

  /**
   * Get text for a specific verse reference (e.g. "JHN.3.16" or by IDs if overloaded).
   * For the shared interface, we might prefer explicit IDs or a standard ref format.
   * Mobile impl uses "JHN.3.16".
   */
  getVerseText(ref: string): Promise<string | null>;

  /**
   * Get Strong's definition by ID (e.g., "G25").
   */
  getStrongsDefinition(strongsId: string): Promise<StrongsDefinition | null>;

  /**
   * Search for verses containing text.
   */
  search(params: BibleSearchParams): Promise<BibleVerse[]>;
}

// Output
export * from './types';
export * from './repositories/IBibleRepository';
export { BibleService as EngineBibleService } from './services/BibleService'; // Alias to avoid conflict with App services
