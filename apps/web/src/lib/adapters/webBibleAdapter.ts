import { BibleEngine, BibleBook, BibleVerse, StrongsDefinition, BibleSearchParams } from '@the-way/bible-engine';
import { db } from '@/lib/db';

export const WebBibleAdapter: BibleEngine = {
  async getBooks(): Promise<BibleBook[]> {
    return await db.query<BibleBook>(`
      SELECT 
        b.id,
        b.name,
        MAX(v.chapter) as chapters,
        CASE 
          WHEN b.id <= 39 THEN 'OT'
          ELSE 'NT'
        END as testament
      FROM "KJV_books" b
      LEFT JOIN "KJV_verses" v ON b.id = v.book_id
      GROUP BY b.id, b.name
      ORDER BY b.id
    `);
  },

  async getChapterVerses(bookId: number, chapter: number): Promise<BibleVerse[]> {
    return await db.query<BibleVerse>(`
      SELECT 
        v.id,
        v.book_id,
        v.chapter,
        v.verse,
        v.text,
        b.name as book_name
      FROM "KJV_verses" v
      JOIN "KJV_books" b ON v.book_id = b.id
      WHERE v.book_id = $1 AND v.chapter = $2
      ORDER BY v.verse
    `, [bookId, chapter]);
  },

  async getVerseText(ref: string): Promise<string | null> {
    // Basic parsing for "JHN.3.16" format
    const parts = ref.split('.');
    if (parts.length < 3) return null;
    
    const bookCode = parts[0]; // Need mapping if code != name
    const chapter = parseInt(parts[1], 10);
    const verse = parseInt(parts[2], 10);

    // Map common codes to names if needed, or query by name
    // For now assuming existing logic or direct query
    // The previous mobile logic had a map, we might need it here too if input is code.
    // However, for MVP let's assume standard names or partial match.
    
    // We can try to find the book by abbreviation map or fuzzy match
    // Reuse the map from mobile if possible, or define a shared constant.
    // For now, simple return null or implement basic lookup if table has codes.
    // KJV_books has 'name', no code column visible in previous queries.
    return null; // TODO: Implement Ref Parsing and Lookup
  },

  async getStrongsDefinition(strongsId: string): Promise<StrongsDefinition | null> {
    const result = await db.query<StrongsDefinition>(`
      SELECT * FROM "strongs_definitions" WHERE strongs_number = $1
    `, [strongsId]);
    return result[0] || null;
  },

  async search(params: BibleSearchParams): Promise<BibleVerse[]> {
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    return await db.query<BibleVerse>(`
      SELECT 
        v.id,
        v.book_id,
        v.chapter,
        v.verse,
        v.text,
        b.name as book_name
      FROM "KJV_verses" v
      JOIN "KJV_books" b ON v.book_id = b.id
      WHERE v.text ILIKE $1
      ORDER BY v.book_id, v.chapter, v.verse
      LIMIT $2 OFFSET $3
    `, [`%${params.query}%`, limit, offset]);
  }
};
