

```typescript
// apps/mobile/hooks/useSocialFeed.ts

import { useEffect, useState, useCallback, useRef } from 'react';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { Post, CreatePostDTO, PostVisibility } from '../types/social';
import { handleSupabaseError } from '../utils/security';

// ─────────────────────────────────────────────────────────────────────────────
// PURE LOGIC (extracted, testable without React/Supabase)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Zod schema for validating CreatePostDTO at runtime.
 * Ensures content is non-empty and visibility is a known enum value.
 */
export const CreatePostSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content cannot be empty')
    .max(5000, 'Post content exceeds maximum length'),
  verse_ref: z.string().optional(),
  visibility: z.nativeEnum(PostVisibility),
});

/**
 * Applies a realtime INSERT event to an existing feed.
 * Pure function: no side-effects, no DB calls.
 *
 * @param currentPosts - The current ordered list of posts.
 * @param newPost - The post that was inserted.
 * @returns A new array with the post prepended (newest-first).
 */
export function applyInsert(currentPosts: Post[], newPost: Post): Post[] {
  // Guard against duplicates (realtime can fire after optimistic insert)
  if (currentPosts.some((p) => p.id === newPost.id)) {
    return currentPosts;
  }
  return [newPost, ...currentPosts];
}

/**
 * Applies a realtime DELETE event to an existing feed.
 *
 * @param currentPosts - The current ordered list of posts.
 * @param deletedId - The id of the removed post.
 * @returns A new array without the deleted post.
 */
export function applyDelete(currentPosts: Post[], deletedId: string): Post[] {
  return currentPosts.filter((p) => p.id !== deletedId);
}

/**
 * Applies a realtime UPDATE event to an existing feed.
 *
 * @param currentPosts - The current ordered list of posts.
 * @param updatedPost - The post with updated fields.
 * @returns A new array with the matching post replaced.
 */
export function applyUpdate(currentPosts: Post[], updatedPost: Post): Post[] {
  return currentPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p));
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK (orchestration only — no business logic lives here)
// ─────────────────────────────────────────────────────────────────────────────

export const useSocialFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMfaRequired, setIsMfaRequired] = useState(false);

  // Track mount status to prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Fetches the initial page of posts (newest-first).
   */
  const fetchPosts = useCallback(async () => {
    try {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!mountedRef.current) return;

      if (fetchError) {
        handleSupabaseError(fetchError);
        setError(fetchError.message);
        return;
      }

      setPosts((data as Post[]) ?? []);
    } catch (err) {
      if (mountedRef.current) {
        const message =
          err instanceof Error ? err.message : 'Unexpected error fetching posts';
        setError(message);
        console.error('Unexpected error fetching posts:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Validates input via Zod, then inserts a new post.
   * Returns the created Post on success, or null on failure.
   */
  const createPost = useCallback(
    async (dto: CreatePostDTO): Promise<Post | null> => {
      setIsMfaRequired(false);
      setError(null);

      // ── Validate with Zod (security: never trust client input) ──
      const parsed = CreatePostSchema.safeParse(dto);
      if (!parsed.success) {
        const message = parsed.error.issues.map((i) => i.message).join('; ');
        setError(message);
        console.error('Validation failed:', message);
        return null;
      }

      const { content, verse_ref, visibility } = parsed.data;

      // ── Authenticate ──
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const msg = 'User not authenticated';
        setError(msg);
        console.error(msg);
        return null;
      }

      // ── Repository call (parameterized by supabase-js — no raw SQL) ──
      const { data, error: insertError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content,
            verse_ref,
            visibility,
          },
        ])
        .select()
        .single();

      if (insertError) {
        handleSupabaseError(insertError, () => setIsMfaRequired(true));
        if (mountedRef.current) {
          setError(insertError.message);
        }
        return null;
      }

      return data as Post;
    },
    [],
  );

  // ── Realtime subscription (side-effect, thin orchestration) ──
  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          if (!mountedRef.current) return;

          switch (payload.eventType) {
            case 'INSERT':
              setPosts((prev) => applyInsert(prev, payload.new as Post));
              break;
            case 'DELETE':
              setPosts((prev) =>
                applyDelete(prev, (payload.old as { id: string }).id),
              );
              break;
            case 'UPDATE':
              setPosts((prev) => applyUpdate(prev, payload.new as Post));
              break;
            default:
              break;
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    createPost,
    isMfaRequired,
    refresh: fetchPosts,
  } as const;
};
```

---

### What changed & why (Simplicity Audit)

| Concern | Before (Complected) | After (De-complected) |
|---|---|---|
| **Feed mutation logic** | Inline lambdas inside realtime callback mixed state + logic | `applyInsert`, `applyDelete`, `applyUpdate` — **pure functions**, testable with `node --test` with zero mocks |
| **Input validation** | None — raw DTO passed straight to Supabase | **Zod schema** (`CreatePostSchema`) validates before any DB call (OWASP input validation) |
| **Error surface** | `console.error` only; caller has no signal | Exposed `error` state string; typed errors flow to UI |
| **Memory safety** | No unmount guard — `setPosts` after unmount → React warning | `mountedRef` prevents post-unmount state writes |
| **Referential stability** | `fetchPosts` / `createPost` recreated every render | Wrapped in `useCallback`; `fetchPosts` is a stable dep for the `useEffect` |
| **Realtime handler** | `if/else if/else if` chain with string comparisons | `switch` on `eventType` — exhaustive, explicit `default` |
| **Duplicate guard** | Realtime INSERT could duplicate an optimistic row | `applyInsert` checks for existing ID |
| **TSDoc** | None | Every exported function documented |

**No new files were created.** Pure logic lives at the top of the same file as exported functions, ready to be lifted into `packages/social-engine` in a future step.