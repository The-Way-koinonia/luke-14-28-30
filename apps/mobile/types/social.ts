/**
 * MOBILE APP INTERNAL TYPES - SOCIAL FEATURES
 * 
 * Purpose: These types represent the mobile app's internal data model for social features,
 * optimized specifically for local persistence, offline sync, and SQLite storage. These are
 * NOT the same as the shared types in @theway/types and serve different purposes.
 * 
 * Characteristics:
 * - Lean, minimal field sets matching database schema exactly
 * - Optimized for storage efficiency and sync operations
 * - May use different data types than shared types (e.g., string timestamps vs Date objects)
 * - Include sync metadata fields (synced_at, server_id) not present in shared types
 * 
 * When to use THESE types:
 * - When persisting data to local SQLite database
 * - When implementing sync logic between local and server
 * - When working with cached data in offline mode
 * - Internal data transformations within the mobile app
 * 
 * When to use SHARED types (from @theway/types):
 * - When making API calls to the server
 * - When receiving data from API responses
 * - When passing data to UI components for rendering
 * - When you need rich, populated data with relationships
 * 
 * Architecture Pattern:
 * This file implements an "anti-corruption layer" that keeps the mobile app's internal
 * data structures independent from server representations. Data should be transformed
 * between these mobile-specific types and shared types at clear boundaries (API layer,
 * persistence layer). This allows the mobile app to evolve its internal storage format
 * without breaking compatibility with the server or other apps.
 * 
 * IMPORTANT: When shared types in @theway/types change, review these types to ensure
 * compatibility is maintained at transformation boundaries. Add mapper functions to handle
 * any structural differences.
 */
export type PostVisibility = 'public' | 'friends' | 'private';

/**
 * Mobile-internal Post representation for local persistence.
 * This mirrors the database schema exactly for efficient SQLite storage.
 * 
 * NOTE: This is different from the Post type in @theway/types which includes
 * populated fields like user data, like counts, etc. Transform between these
 * representations at the API boundary using mapper functions.
 * 
 * @see packages/types/src/index.ts for the shared Post type used in API communication
 */
export interface Post {
  id: string; // UUID
  user_id: string; // UUID
  content: string;
  verse_ref: string; // e.g., "JHN.3.16"
  visibility: PostVisibility;
  created_at: string;
  updated_at: string;
}

/**
 * Data Transfer Object for creating new posts via API.
 * Contains only the fields that clients should provide when creating posts.
 * Server-generated fields (id, timestamps) and metadata are excluded.
 * 
 * This DTO defines the contract between mobile app and API server for post creation.
 */
export interface CreatePostDTO {
  content: string;
  verse_ref: string;
  visibility: PostVisibility;
}
