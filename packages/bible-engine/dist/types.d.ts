export interface BibleBook {
    id: number;
    book_number?: number;
    name: string;
    testament: 'OT' | 'NT' | string;
    chapters: number;
}
export interface BibleVerse {
    id?: number;
    book_id: number;
    chapter: number;
    verse: number;
    text: string;
    translation?: string;
    book_name?: string;
}
export interface StrongsDefinition {
    strongs_number: string;
    lemma?: string;
    original_word?: string;
    transliteration?: string;
    pronunciation?: string;
    definition?: string;
    usage?: string;
    kjv_usage?: string;
    part_of_speech?: string;
}
export interface BibleSearchParams {
    query: string;
    limit?: number;
    offset?: number;
}
