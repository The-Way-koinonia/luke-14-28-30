import { BibleEngine, BibleBook, BibleVerse, StrongsDefinition, BibleSearchParams } from '@the-way/bible-engine';
import { getDb, parseVerseRef } from '@/utils/bibleDb';

export const MobileBibleAdapter: BibleEngine = {
  async getBooks(): Promise<BibleBook[]> {
    const db = await getDb();
    // Mobile table is 'bible_books'
    return await db.getAllAsync<BibleBook>('SELECT * FROM bible_books ORDER BY id ASC');
  },

  async getChapterVerses(bookId: number, chapter: number): Promise<BibleVerse[]> {
    const db = await getDb();
    // Mobile table is 'bible_verses'
    // Join with books for book_name if needed by interface
    return await db.getAllAsync<BibleVerse>(
      `SELECT v.*, b.name as book_name 
       FROM bible_verses v
       JOIN bible_books b ON v.book_id = b.id
       WHERE v.book_id = ? AND v.chapter = ? 
       ORDER BY v.verse ASC`,
      [bookId, chapter]
    );
  },

  async getVerseText(ref: string): Promise<string | null> {
    const parsed = parseVerseRef(ref);
    if (!parsed) return null;

    const db = await getDb();
    // Need mapping logic same as util
    // We can reuse the existing logic in utils/bibleDb.ts but wrapped here
    // For now, let's call a helper or duplicate simple version.
    // Ideally we expose `getVerseText` from `utils/bibleDb.ts` and just call it.
    
    // Map codes (simplified for now, ideally shared constant)
    const bookMap: Record<string, string> = {
        'JHN': 'John', 'GEN': 'Genesis', 'EXO': 'Exodus', 'MAT': 'Matthew',
        'MRK': 'Mark', 'LUK': 'Luke', 'ACT': 'Acts', 'ROM': 'Romans'
    };
    const bookName = bookMap[parsed.bookCode];
    if (!bookName) return null;

    const result = await db.getAllAsync<{ text: string }>(
      `SELECT bv.text 
       FROM bible_verses bv
       JOIN bible_books bb ON bv.book_id = bb.id
       WHERE bb.name = ? AND bv.chapter = ? AND bv.verse = ?
       LIMIT 1`,
      [bookName, parsed.chapter, parsed.verse]
    );
    return result.length > 0 ? result[0].text : null;
  },

  async getStrongsDefinition(strongsId: string): Promise<StrongsDefinition | null> {
    const db = await getDb();
    const result = await db.getAllAsync<StrongsDefinition>(
        'SELECT * FROM strongs_definitions WHERE strongs_number = ?',
        [strongsId]
    );
    return result.length > 0 ? result[0] : null;
  },

  async search(params: BibleSearchParams): Promise<BibleVerse[]> {
    const db = await getDb();
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    
    return await db.getAllAsync<BibleVerse>(
      `SELECT v.*, b.name as book_name 
       FROM bible_verses v
       JOIN bible_books b ON v.book_id = b.id
       WHERE v.text LIKE ? 
       ORDER BY v.book_id, v.chapter, v.verse
       LIMIT ? OFFSET ?`,
      [`%${params.query}%`, limit, offset]
    );
  }
};
