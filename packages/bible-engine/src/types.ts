export interface BibleBook {
  id: number;
  book_number?: number; // Some sources might assume id == book_number
  name: string;
  testament: 'OT' | 'NT' | string;
  chapters: number;
}

export interface BibleVerse {
  id?: number; // Optional as not all sources might return unique row ID
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
  translation?: string;
  book_name?: string; // Often joined for convenience
}

export interface StrongsDefinition {
  strongs_number: string;
  lemma?: string;
  original_word?: string; // Mapped from lemma or separate col
  transliteration?: string;
  pronunciation?: string;
  definition?: string;
  usage?: string;
  kjv_usage?: string; // For mobile compatibility
  part_of_speech?: string;
}

export interface BibleSearchParams {
    query: string;
    limit?: number;
    offset?: number;
}
