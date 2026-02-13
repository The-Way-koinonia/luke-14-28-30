

```typescript
// ============================================================
// apps/mobile/utils/mobileSocialAdapter.ts
//
// Single-file refactor: all repository, service, and adapter
// logic co-located per the CRITICAL CONSTRAINT.
//
// Architecture (top → bottom):
//   1. Pure helper functions (no I/O, fully testable)
//   2. Zod schemas (validation as values)
//   3. Typed error class
//   4. Repository interface + Supabase implementation
//   5. Domain service (orchestration over injected repo)
//   6. Adapter singleton (exported, satisfies SocialAdapter)
// ============================================================

import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import type { Post, SocialAdapter } from '@the-way/social-engine';

// ────────────────────────────────────────────────────────────
// 1. PURE LOGIC — extracted, exported, testable without mocks
// ────────────────────────────────────────────────────────────

/**
 * Narrows an array of unknown DB rows to typed `Post[]`.
 *
 * Currently a pass-through cast; future iterations can add
 * runtime validation via a `PostSchema` without touching
 * any other layer.
 *
 * @param rows - Raw rows returned from the repository.
 * @returns Typed post array.
 */
export function toPostArray(rows: unknown[]): Post[] {
  return rows as Post[];
}

/**
 * Narrows a single unknown DB row to a typed `Post`.
 *
 * @param row - Raw row returned from the repository.
 * @returns Typed post.
 */
export function toPost(row: unknown): Post {
  return row as Post;
}

// ────────────────────────────────────────────────────────────
// 2. VALIDATION SCHEMAS (Values, not objects)
// ────────────────────────────────────────────────────────────

/** Validates feed query parameters. */
const FeedQuerySchema = z.object({
  limit: z.number().int().positive().max(100),
  cursor: z.string().datetime().optional(),
});

/** Validates post creation input. */
const CreatePostInputSchema = z.object({
  content: z.string().min(1).max(5000),
  userId: z.string().uuid(),
});

/** Validates any UUID identifier (post ID, user ID, etc.). */
const UuidSchema = z.string().uuid();

// ────────────────────────────────────────────────────────────
// 3. TYPED ERROR
// ────────────────────────────────────────────────────────────

/**
 * Typed error for repository-level failures.
 * Keeps the operation name attached for observability.
 */
export class SocialRepositoryError extends Error {
  public readonly name = 'SocialRepositoryError' as const;

  constructor(
    public readonly operation: string,
    message: string,
  ) {
    super(`[SocialRepository.${operation}] ${message}`);
  }
}

// ────────────────────────────────────────────────────────────
// 4. REPOSITORY — Incidental Complexity (I/O boundary)
// ────────────────────────────────────────────────────────────

const POST_SELECT_WITH_USER = `
  *,
  user:user_id (
    id,
    username,
    avatar_url
  )
` as const;

/**
 * Contract for social data access.
 * Allows the service layer to remain I/O-agnostic and testable
 * via a stub/mock implementation.
 */
export interface ISocialRepository {
  /** Fetches a page of posts ordered by recency. */
  fetchPosts(limit: number, cursor?: string): Promise<unknown[]>;
  /** Inserts a like record for a given user and post. */
  insertLike(userId: string, postId: string): Promise<void>;
  /** Inserts a new post and returns the full row with user join. */
  insertPost(userId: string, content: string): Promise<unknown>;
  /** Returns the currently authenticated user ID, or null. */
  getAuthenticatedUserId(): Promise<string | null>;
}

class SupabaseSocialRepository implements ISocialRepository {
  /**
   * Fetches a paginated feed of posts with author info.
   * @param limit  - Maximum number of posts to return (1–100).
   * @param cursor - ISO-8601 timestamp for cursor-based pagination.
   */
  async fetchPosts(limit: number, cursor?: string): Promise<unknown[]> {
    const params = FeedQuerySchema.parse({ limit, cursor });

    let query = supabase
      .from('posts')
      .select(POST_SELECT_WITH_USER)
      .order('created_at', { ascending: false })
      .limit(params.limit);

    if (params.cursor) {
      query = query.lt('created_at', params.cursor);
    }

    const { data, error } = await query;
    if (error) throw new SocialRepositoryError('fetchPosts', error.message);
    return data ?? [];
  }

  /**
   * Inserts a row into the `likes` table (upsert to avoid duplicates).
   * @param userId - The user performing the like.
   * @param postId - The post being liked.
   */
  async insertLike(userId: string, postId: string): Promise<void> {
    const validUserId = UuidSchema.parse(userId);
    const validPostId = UuidSchema.parse(postId);

    const { error } = await supabase
      .from('likes')
      .upsert(
        { user_id: validUserId, post_id: validPostId },
        { onConflict: 'user_id,post_id' },
      );

    if (error) throw new SocialRepositoryError('insertLike', error.message);
  }

  /**
   * Inserts a new post and returns the created row with joined user data.
   * @param userId  - The author's user ID.
   * @param content - The post body text.
   */
  async insertPost(userId: string, content: string): Promise<unknown> {
    const params = CreatePostInputSchema.parse({ content, userId });

    const { data, error } = await supabase
      .from('posts')
      .insert({ content: params.content, user_id: params.userId })
      .select(POST_SELECT_WITH_USER)
      .single();

    if (error) throw new SocialRepositoryError('insertPost', error.message);
    return data;
  }

  /**
   * Resolves the current session's user ID from Supabase Auth.
   */
  async getAuthenticatedUserId(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  }
}

// ────────────────────────────────────────────────────────────
// 5. SERVICE — Essential Complexity (Domain orchestration)
// ────────────────────────────────────────────────────────────

/**
 * Domain service that orchestrates social operations.
 * Contains no DB or framework imports — only pure orchestration
 * over an injected repository and extracted pure functions.
 */
class SocialService {
  constructor(private readonly repo: ISocialRepository) {}

  /**
   * Returns a typed page of feed posts.
   * @param limit  - Page size (1–100).
   * @param cursor - Optional pagination cursor (ISO-8601).
   */
  async getFeed(limit: number, cursor?: string): Promise<Post[]> {
    const rows = await this.repo.fetchPosts(limit, cursor);
    return toPostArray(rows);
  }

  /**
   * Likes a post on behalf of the currently authenticated user.
   * @param postId - The post to like.
   * @throws {Error} If no active session exists.
   */
  async likePost(postId: string): Promise<void> {
    const userId = await this.requireAuth();
    await this.repo.insertLike(userId, postId);
  }

  /**
   * Creates a new post for the currently authenticated user.
   * @param content - The post body.
   * @throws {Error} If no active session exists.
   */
  async createPost(content: string): Promise<Post> {
    const userId = await this.requireAuth();
    const row = await this.repo.insertPost(userId, content);
    return toPost(row);
  }

  /** @internal Resolves the auth user or throws a domain error. */
  private async requireAuth(): Promise<string> {
    const userId = await this.repo.getAuthenticatedUserId();
    if (!userId) {
      throw new Error('Not authenticated');
    }
    return userId;
  }
}

// ────────────────────────────────────────────────────────────
// 6. ADAPTER — Thin bridge satisfying the SocialAdapter contract
// ────────────────────────────────────────────────────────────

const repository: ISocialRepository = new SupabaseSocialRepository();
const service = new SocialService(repository);

/**
 * Thin adapter that satisfies the `SocialAdapter` contract
 * by delegating to the domain `SocialService`.
 *
 * No business logic lives here — only shape adaptation.
 */
export const MobileSocialAdapter: SocialAdapter = {
  fetchFeed: (limit, cursor) => service.getFeed(limit, cursor),
  likePost: (postId) => service.likePost(postId),
  createPost: (content) => service.createPost(content),
};
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **File count** | 3 separate files referenced but task scoped to 1 | Single file, all layers co-located per constraint |
| **Pure logic extraction** | `rows as Post[]` cast buried inside service methods | `toPostArray` / `toPost` exported at file top — testable in plain Node without mocking Supabase or Expo |
| **Complected validation schema** | `PostIdSchema` reused ambiguously for both user IDs and post IDs | Renamed to `UuidSchema` — single, clear semantic: "validates any UUID" |
| **Repository typing** | `repository` variable had no explicit interface annotation | Typed as `ISocialRepository` so the compiler enforces the contract at the binding site |
| **Error class** | `this.name` set imperatively in constructor body | `readonly name` as a class field — immutable, no re-assignment possible |
| **TSDoc coverage** | Partial | Every exported function, class, interface, and schema documented |
| **Security (OWASP/Zod)** | Already solid — parameterised Supabase calls + Zod | Preserved; no regressions. All public surface inputs validated before touching I/O |