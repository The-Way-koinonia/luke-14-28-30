import { db } from '../index';

interface BibleBook {
  id: number;
  name: string;
}

interface BibleVerse {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
  book_name?: string;
}

export const bibleRepository = {
  async getAllBooks(): Promise<BibleBook[]> {
    return await db.query<BibleBook>('SELECT * FROM "KJV_books" ORDER BY id');
  },

  async getVersesByChapter(bookId: number, chapter: number): Promise<BibleVerse[]> {
    return await db.query<BibleVerse>(
      `SELECT v.*, b.name as book_name 
       FROM "KJV_verses" v
       JOIN "KJV_books" b ON v.book_id = b.id
       WHERE v.book_id = $1 AND v.chapter = $2
       ORDER BY v.verse`,
      [bookId, chapter]
    );
  },

  async searchVerses(searchTerm: string, limit: number = 50): Promise<BibleVerse[]> {
    return await db.query<BibleVerse>(
      `SELECT v.*, b.name as book_name 
       FROM "KJV_verses" v
       JOIN "KJV_books" b ON v.book_id = b.id
       WHERE v.text ILIKE $1
       ORDER BY v.book_id, v.chapter, v.verse
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );
  }
};
