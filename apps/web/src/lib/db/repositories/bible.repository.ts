import { db } from '../index';
import type { BibleVerse, BibleBook } from '@the-way/types';

export const bibleRepository = {
  async getVerse(
    bookId: number,
    chapter: number,
    verse: number,
    translation: string = 'KJV'
  ): Promise<BibleVerse | null> {
    return db.queryOne<BibleVerse>(
      `SELECT 
        bv.id,
        bv.translation,
        bv.book_id,
        bv.chapter,
        bv.verse,
        bv.text,
        bb.name as book_name
      FROM bible_verses bv
      JOIN bible_books bb ON bv.book_id = bb.id
      WHERE bv.translation = $1 
        AND bv.book_id = $2 
        AND bv.chapter = $3 
        AND bv.verse = $4`,
      [translation, bookId, chapter, verse]
    );
  },

  async getChapter(
    bookId: number,
    chapter: number,
    translation: string = 'KJV'
  ): Promise<BibleVerse[]> {
    return db.query<BibleVerse>(
      `SELECT 
        bv.id,
        bv.translation,
        bv.book_id,
        bv.chapter,
        bv.verse,
        bv.text,
        bb.name as book_name
      FROM bible_verses bv
      JOIN bible_books bb ON bv.book_id = bb.id
      WHERE bv.translation = $1 
        AND bv.book_id = $2 
        AND bv.chapter = $3
      ORDER BY bv.verse`,
      [translation, bookId, chapter]
    );
  },

  async getAllBooks(): Promise<BibleBook[]> {
    return db.query<BibleBook>(
      `SELECT * FROM bible_books ORDER BY book_number`
    );
  }
};