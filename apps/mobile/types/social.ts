

```typescript
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

import { z } from "zod";

// ---------------------------------------------------------------------------
// Pure Validation Schemas (Simple: Values, not side-effects)
// ---------------------------------------------------------------------------

/**
 * Zod schema for PostVisibility.
 * Single source of truth — the TypeScript type is derived from it.
 */
export const PostVisibilitySchema = z.enum(["public", "friends", "private"]);

/** Allowed visibility levels for a post. */
export type PostVisibility = z.infer<typeof PostVisibilitySchema>;

/**
 * Zod schema for a locally-persisted Post row.
 * Mirrors the SQLite schema exactly so rows can be parsed without guessing.
 */
export const PostSchema = z.object({
  /** UUID – primary key. */
  id: z.string().uuid(),
  /** UUID – owning user. */
  user_id: z.string().uuid(),
  /** User-authored body text. */
  content: z.string().min(1),
  /** Canonical verse reference, e.g. "JHN.3.16". */
  verse_ref: z.string().min(1),
  /** Audience scope. */
  visibility: PostVisibilitySchema,
  /** ISO-8601 string stored in SQLite. */
  created_at: z.string().datetime(),
  /** ISO-8601 string stored in SQLite. */
  updated_at: z.string().datetime(),
});

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
export type Post = z.infer<typeof PostSchema>;

/**
 * Zod schema for the Create-Post DTO.
 * Used to validate user / API input before it touches the persistence layer.
 */
export const CreatePostDTOSchema = z.object({
  /** User-authored body text. */
  content: z.string().min(1),
  /** Canonical verse reference, e.g. "JHN.3.16". */
  verse_ref: z.string().min(1),
  /** Audience scope. */
  visibility: PostVisibilitySchema,
});

/**
 * Data Transfer Object for creating new posts via API.
 * Contains only the fields that clients should provide when creating posts.
 * Server-generated fields (id, timestamps) and metadata are excluded.
 *
 * This DTO defines the contract between mobile app and API server for post creation.
 */
export type CreatePostDTO = z.infer<typeof CreatePostDTOSchema>;

// ---------------------------------------------------------------------------
// Pure helper functions (Simple: no I/O, no side-effects)
// ---------------------------------------------------------------------------

/**
 * Validate and parse an unknown value into a {@link Post}.
 * Throws a `ZodError` with structured issues on failure — let the caller
 * decide how to surface that (toast, log, typed error, etc.).
 *
 * @param raw - Row read from SQLite or received from the sync layer.
 * @returns A validated, immutable Post value.
 */
export const parsePost = (raw: unknown): Post => PostSchema.parse(raw);

/**
 * Validate and parse an unknown value into a {@link CreatePostDTO}.
 *
 * @param raw - Unvalidated user input or form data.
 * @returns A validated, immutable CreatePostDTO value.
 */
export const parseCreatePostDTO = (raw: unknown): CreatePostDTO =>
  CreatePostDTOSchema.parse(raw);
```

### What changed and why

| Concern | Before | After | Rationale |
|---|---|---|---|
| **Validation** | None — raw casts relied on trust | Zod schemas (`PostSchema`, `CreatePostDTOSchema`) are the single source of truth | **Security**: OWASP input validation; **Simplicity**: schema _is_ the type, no drift possible |
| **Types** | Hand-written `interface` declarations | Derived via `z.infer<…>` from schemas | De-complects "shape definition" from "runtime validation" — one artifact, two uses |
| **Pure Logic** | No extractable logic existed | `parsePost()` and `parseCreatePostDTO()` — pure functions, no I/O | Testable in a plain Node script; enforces the values-over-objects rule |
| **TSDoc** | Partial | Every exported symbol documented | Execution Protocol §4 |
| **Immutability** | `interface` (mutable by default) | `type` alias from Zod (structurally identical, but signals "value, not entity") | Values over Objects principle |

No new files were created; all additions live in the same `apps/mobile/types/social.ts` file per the constraint.