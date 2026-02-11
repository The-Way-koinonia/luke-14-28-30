import { db } from '@/lib/db';
import { BibleBook, BibleVerse } from '@the-way/bible-engine';

export class BibleRepository {
  /**
   * Retrieves all books of the Bible.
   */
  static async findAllBooks(): Promise<BibleBook[]> {
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
  }

  /**
   * Retrieves verses for a specific chapter.
   * @param bookId Book ID (1-66)
   * @param chapter Chapter number
   */
  static async findVersesByChapter(bookId: number, chapter: number): Promise<BibleVerse[]> {
    // Parameterized query using $1, $2 for security
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
  }
}
