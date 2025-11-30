// Shared TypeScript types for The Way monorepo

// ============================================
// BIBLE TYPES
// ============================================

export interface BibleBook {
  id: number;
  book_number: number;
  name: string;
  testament: 'OT' | 'NT';
  chapters: number;
  created_at?: Date;
}

export interface BibleVerse {
  id: number;
  translation: string;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
  strongs_data?: StrongsWord[];
  created_at?: Date;
}

export interface StrongsWord {
  position: number;
  word: string;
  strongs_number: string;
}

export interface StrongsDefinition {
  id: number;
  strongs_number: string;
  lemma: string;
  transliteration: string;
  definition: string;
  language: 'Hebrew' | 'Greek';
  pronunciation?: string;
  kjv_translation?: string;
  created_at?: Date;
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile extends User {
  followers_count: number;
  following_count: number;
  posts_count: number;
}

// ============================================
// SOCIAL TYPES
// ============================================

export interface Post {
  id: string;
  user_id: string;
  content: string;
  verse_reference?: VerseReference;
  media_urls?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: Date;
  updated_at: Date;
  
  // Populated fields
  user?: User;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: Date;
  
  // Populated fields
  user?: User;
}

export interface VerseReference {
  book_name: string;
  book_id: number;
  chapter: number;
  verse: number;
  translation?: string;
}

// ============================================
// CHURCH TYPES
// ============================================

export interface Church {
  id: string;
  name: string;
  description?: string;
  location?: string;
  avatar_url?: string;
  verified: boolean;
  members_count: number;
  created_at: Date;
}

export interface ChurchGroup {
  id: string;
  church_id: string;
  name: string;
  description?: string;
  is_private: boolean;
  members_count: number;
  created_at: Date;
}

export interface PrayerRequest {
  id: string;
  user_id: string;
  church_id?: string;
  group_id?: string;
  title: string;
  description: string;
  is_answered: boolean;
  prayers_count: number;
  created_at: Date;
  updated_at: Date;
  
  // Populated fields
  user?: User;
}

// ============================================
// STUDY TYPES
// ============================================

export interface Highlight {
  id: string;
  user_id: string;
  book_id: number;
  chapter: number;
  verse: number;
  color: string;
  note?: string;
  created_at: Date;
  synced_at?: Date;
}

export interface Bookmark {
  id: string;
  user_id: string;
  book_id: number;
  chapter: number;
  verse: number;
  created_at: Date;
}

export interface ReadingPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date: Date;
  end_date?: Date;
  is_completed: boolean;
  created_at: Date;
}

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

// ============================================
// DATABASE TYPES
// ============================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}
