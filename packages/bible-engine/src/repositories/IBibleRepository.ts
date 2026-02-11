import { BibleBook, BibleVerse, BibleSearchParams, StrongsDefinition } from '../types';

export interface IBibleRepository {
  getBooks(): Promise<BibleBook[]>;
  getChapter(bookId: number, chapter: number): Promise<BibleVerse[]>;
  search(params: BibleSearchParams): Promise<BibleVerse[]>;
  getStrongsDefinition(strongsId: string): Promise<StrongsDefinition | null>;
}
