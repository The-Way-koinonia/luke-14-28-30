import { IBibleRepository } from '../repositories/IBibleRepository';
import { BibleBook, BibleVerse, StrongsDefinition } from '../types';
export declare class BibleService {
    private repository;
    constructor(repository: IBibleRepository);
    /**
     * Retrieves all books of the Bible.
     */
    getBooks(): Promise<BibleBook[]>;
    /**
     * Retrieves a chapter of verses.
     * Logic for text formatting can be added here.
     */
    getFormattedChapter(bookId: number, chapter: number): Promise<BibleVerse[]>;
    /**
     * Searches for verses matching the query.
     */
    searchVerses(query: string, limit?: number, offset?: number): Promise<BibleVerse[]>;
    /**
     * Retrieves a Strong's definition by ID.
     */
    getStrongsDefinition(strongsId: string): Promise<StrongsDefinition | null>;
}
