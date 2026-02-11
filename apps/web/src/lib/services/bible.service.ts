import { BibleRepository } from '@/lib/db/repositories/bible.repository';
import { BibleBook, BibleVerse } from '@the-way/bible-engine';

export class BibleService {
  /**
   * Get all Bible books with metadata.
   */
  static async getBooks(): Promise<BibleBook[]> {
    return await BibleRepository.findAllBooks();
  }

  /**
   * Get verses for a chapter, optionally filtering by specific verse number.
   * @param bookId Book ID
   * @param chapter Chapter number
   * @param verse Optional verse number to filter by
   */
  static async getVerses(bookId: number, chapter: number, verse?: number): Promise<BibleVerse[]> {
    const verses = await BibleRepository.findVersesByChapter(bookId, chapter);

    if (!verses || verses.length === 0) {
      throw new Error('No verses found for this chapter');
    }

    if (verse) {
      const singleVerse = verses.find((v) => v.verse === verse);
      return singleVerse ? [singleVerse] : [];
    }

    return verses;
  }
}
