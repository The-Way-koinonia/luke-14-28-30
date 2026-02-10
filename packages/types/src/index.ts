// Shared TypeScript types for The Way monorepo
/**
 * SHARED TYPES FOR THE WAY MONOREPO
 * 
 * Purpose: These types represent the canonical data models shared across all applications
 * in The Way monorepo including mobile app, web app, and API server. These types define
 * the rich, fully-populated data structures used for API communication and UI rendering.
 * 
 * Characteristics:
 * - Includes all fields needed for complete feature functionality
 * - Contains optional "populated fields" that may be joined from related tables
 * - Optimized for developer experience and type safety across the entire platform
 * - Represents the source of truth for cross-platform data contracts
 * 
 * Guidelines:
 * - Use these types when communicating between client and server via API
 * - Use these types when rendering UI components that need rich data
 * - Changes to these types affect all apps - coordinate with all teams
 * - Breaking changes require migration plans for all consuming applications
 * 
 * Note: Individual apps may have their own internal types optimized for specific needs
 * like persistence, caching, or offline sync. Those app-specific types should transform
 * to/from these shared types at application boundaries.
 */

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

/**
 * Complete Post representation with all metadata and optional populated relationships.
 * This is the canonical Post type used across all applications for API communication.
 * 
 * NOTE: Individual apps may have their own internal Post types optimized for specific
 * needs (e.g., mobile app has a lean version for SQLite persistence). Those should
 * transform to/from this shared type at application boundaries.
 */
export interface Post {
  id: string;
  user_id: string;
  content: string;
  verse_reference?: VerseReference;
  media_type?: 'text' | 'image' | 'video' | 'audio';
  media_urls?: string[]; // Keep legacy array
  media_url?: string;    // Add single URL for new api
  quoted_post?: Post;
  quoted_post_id?: string;
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

/**
 * Controls who can see the user's current reading location.
 */
export interface ReadingLocationPreferences {
  id: string;
  user_id: string;
  visibility: 'public' | 'friends' | 'private';
  show_on_profile: boolean;
  share_reading_history: boolean;
  updated_at: Date;
  synced_at?: Date;
}

/**
 * Tracks reading sessions for statistics and accountability features.
 */
export interface ReadingSession {
  id: string;
  user_id: string;
  book_id: number;
  chapter_start: number;
  chapter_end: number;
  verse_start?: number;
  verse_end?: number;
  started_at: Date;
  ended_at?: Date;
  duration_seconds?: number;
  reading_plan_id?: string;
  created_at: Date;
  synced_at?: Date;
}

/**
 * Represents a user-created tag that can be applied to notes.
 */
export interface Tag {
  id: string;
  user_id: string;
  tag_name: string;
  created_at: Date;
  synced_at?: Date;
}

/**
 * Links tags to notes in a many-to-many relationship.
 */
export interface NoteTag {
  id: string;
  note_id: string;
  tag_id: string;
  created_at: Date;
  synced_at?: Date;
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

// ============================================
// DATABASE UPDATE TYPES
// ============================================

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
