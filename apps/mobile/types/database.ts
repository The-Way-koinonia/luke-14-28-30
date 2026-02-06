export interface DatabaseUpdate {
  latest_version: number;
  current_version: number;
  has_updates: boolean;
  changes: DatabaseChange[];
  update_size_bytes?: number;
  description?: string;
}

export interface DatabaseChange {
  table: string;
  operation: 'update' | 'insert' | 'delete';
  where?: Record<string, any>;
  data?: Record<string, any>;
}

export interface UpdateCheckOptions {
  force?: boolean;    // Bypass cooldown period
  silent?: boolean;   // Don't show UI notifications
}

export interface BibleBook {
  id: number;
  book_number: number;
  name: string;
  testament: 'OT' | 'NT';
  chapters: number;
}

export interface BibleVerse {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface StrongsDefinition {
  strongs_number: string;
  definition: string;
  original_word?: string;
  transliteration?: string;
  pronunciation?: string;
  part_of_speech?: string;
  kjv_usage?: string;
}
