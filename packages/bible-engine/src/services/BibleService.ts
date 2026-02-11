import { IBibleRepository } from '../repositories/IBibleRepository';
import { BibleBook, BibleVerse, BibleSearchParams, StrongsDefinition } from '../types';

export class BibleService {
  constructor(private repository: IBibleRepository) {}

  /**
   * Retrieves all books of the Bible.
   */
  async getBooks(): Promise<BibleBook[]> {
    return this.repository.getBooks();
  }

  /**
   * Retrieves a chapter of verses.
   * Logic for text formatting can be added here.
   */
  async getFormattedChapter(bookId: number, chapter: number): Promise<BibleVerse[]> {
    const verses = await this.repository.getChapter(bookId, chapter);
    // Future: Add XML stripping or red-letter logic here
    return verses;
  }

  /**
   * Searches for verses matching the query.
   */
  async searchVerses(query: string, limit: number = 20, offset: number = 0): Promise<BibleVerse[]> {
    return this.repository.search({ query, limit, offset });
  }

  /**
   * Retrieves a Strong's definition by ID.
   */
  async getStrongsDefinition(strongsId: string): Promise<StrongsDefinition | null> {
    return this.repository.getStrongsDefinition(strongsId);
  }
}
