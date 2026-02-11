import { BibleRepository } from '../repositories/BibleRepository';
import { EngineBibleService, BibleBook, BibleVerse, StrongsDefinition } from '@the-way/bible-engine';

// Initialize the Engine Service with the Mobile Repository
const repository = BibleRepository.getInstance();
const engineService = new EngineBibleService(repository);

export class BibleService {
  /**
   * Retrieves all books of the bible.
   */
  static async getBooks(): Promise<BibleBook[]> {
    return engineService.getBooks();
  }

  /**
   * Retrieves all verses for a specific chapter.
   */
  static async getChapter(bookId: number, chapter: number): Promise<BibleVerse[]> {
    // We can use getFormattedChapter if we want engine logic, or just getChapter
    return engineService.getFormattedChapter(bookId, chapter);
  }

  /**
   * Gets a specific Strong's word definition.
   */
  static async getStrongsDefinition(strongsId: string): Promise<StrongsDefinition | null> {
    return engineService.getStrongsDefinition(strongsId);
  }

  /**
   * Parses a reference (JHN.3.16) and fetches text.
   * Note: This logic is specific to mobile needs for now, or could be moved to Engine if generic.
   */
  static async getVerseText(ref: string): Promise<string | null> {
    const parts = ref.split('.');
    if (parts.length < 3) return null;
    
    const bookCode = parts[0];
    const chapter = parseInt(parts[1], 10);
    const verse = parseInt(parts[2], 10);

    const bookMap: Record<string, string> = {
        'JHN': 'John', 'GEN': 'Genesis', 'EXO': 'Exodus', 
        'MAT': 'Matthew', 'MRK': 'Mark', 'LUK': 'Luke', 
        'ACT': 'Acts', 'ROM': 'Romans', 'PSA': 'Psalms'
    };
    
    const bookName = bookMap[bookCode];
    if (!bookName) return `[Unknown Book Code: ${bookCode}]`;

    return await repository.getVerseText(bookName, chapter, verse);
  }
}
