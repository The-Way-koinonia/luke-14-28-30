

```tsx
// apps/mobile/components/SocialPostCard.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types/social';
import { BibleService } from '@/services/BibleService';

// ─────────────────────────────────────────────────────────────
// PURE LOGIC — Extracted, testable without React or RN mocks
// ─────────────────────────────────────────────────────────────

/** Truncates a UUID-style user ID into a short display name. */
export const formatUsername = (userId: string): string => {
  if (!userId || userId.length < 8) return 'Unknown';
  return `User ${userId.slice(0, 8)}`;
};

/** Formats an ISO date string into a locale-aware short date. */
export const formatTimestamp = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
};

/**
 * Returns the appropriate Ionicons glyph name for a post visibility level.
 * Defaults to 'lock-closed' for any unrecognised value (secure-by-default).
 */
export const visibilityIcon = (
  visibility: Post['visibility'],
): 'globe' | 'people' | 'lock-closed' => {
  switch (visibility) {
    case 'public':
      return 'globe';
    case 'friends':
      return 'people';
    default:
      return 'lock-closed';
  }
};

/**
 * Pure reducer for a like toggle.
 * Given current state, returns next state — no side-effects.
 */
export const toggleLikeState = (
  currentlyLiked: boolean,
  currentCount: number,
): { liked: boolean; count: number } => {
  return currentlyLiked
    ? { liked: false, count: Math.max(0, currentCount - 1) }
    : { liked: true, count: currentCount + 1 };
};

/**
 * Formats a like count for display.
 * Returns an empty string when the count is zero (cleaner UI).
 */
export const formatLikeCount = (count: number): string =>
  count > 0 ? String(count) : '';

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

interface SocialPostCardProps {
  /** The post model to render. */
  post: Post;
  /** Optional: initial like count from server/cache. Avoids random mock data. */
  initialLikeCount?: number;
  /** Optional: whether the current user has already liked this post. */
  initialLiked?: boolean;
}

/**
 * Renders a single social-feed post card with optional Bible verse bridge,
 * like/comment/share actions, and visibility badge.
 */
export const SocialPostCard: React.FC<SocialPostCardProps> = ({
  post,
  initialLikeCount = 0,
  initialLiked = false,
}) => {
  // ── Verse fetch state ──
  const [verseText, setVerseText] = useState<string | null>(null);
  const [loadingVerse, setLoadingVerse] = useState<boolean>(!!post.verse_ref);

  // ── Like state (driven by pure toggleLikeState) ──
  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [likesCount, setLikesCount] = useState<number>(initialLikeCount);

  const handleToggleLike = useCallback(() => {
    const next = toggleLikeState(liked, likesCount);
    setLiked(next.liked);
    setLikesCount(next.count);
  }, [liked, likesCount]);

  // ── Verse side-effect (Repository-level call, kept thin) ──
  useEffect(() => {
    if (!post.verse_ref) {
      setLoadingVerse(false);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setLoadingVerse(true);
      try {
        const text = await BibleService.getVerseText(post.verse_ref);
        if (!cancelled) {
          setVerseText(text);
        }
      } catch {
        // Graceful offline degradation — verseText stays null
      } finally {
        if (!cancelled) {
          setLoadingVerse(false);
        }
      }
    };

    fetch();

    return () => {
      cancelled = true;
    };
  }, [post.verse_ref]);

  // ── Derived values (pure) ──
  const displayName = formatUsername(post.user_id);
  const displayDate = formatTimestamp(post.created_at);
  const visIcon = visibilityIcon(post.visibility);
  const displayLikes = formatLikeCount(likesCount);

  return (
    <View style={styles.card}>
      {/* ── Header: User Info ── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color="#666" />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.username}>{displayName}</Text>
          <Text style={styles.timestamp}>{displayDate}</Text>
        </View>

        <View style={styles.visibilityBadge}>
          <Ionicons name={visIcon} size={12} color="#888" />
          <Text style={styles.visibilityText}>{post.visibility}</Text>
        </View>
      </View>

      {/* ── Content ── */}
      <Text style={styles.content}>{post.content}</Text>

      {/* ── Bible Verse Bridge (only when verse_ref exists) ── */}
      {post.verse_ref ? (
        <View style={styles.verseContainer}>
          <View style={styles.verseHeader}>
            <Ionicons name="book-outline" size={16} color="#4A90E2" />
            <Text style={styles.verseRef}>{post.verse_ref}</Text>
          </View>

          {loadingVerse ? (
            <View style={styles.skeletonContainer}>
              <View style={[styles.skeletonLine, { width: '90%' }]} />
              <View style={[styles.skeletonLine, { width: '70%' }]} />
            </View>
          ) : (
            <Text style={styles.verseText}>
              {verseText ?? 'Verse text unavailable offline.'}
            </Text>
          )}
        </View>
      ) : null}

      {/* ── Footer Actions ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleToggleLike}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? '#e91e63' : '#333'}
          />
          {displayLikes !== '' && (
            <Text style={styles.actionText}>{displayLikes}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="Comment on post"
        >
          <Ionicons name="chatbubble-outline" size={24} color="#333" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="Share post"
        >
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  visibilityText: {
    fontSize: 10,
    color: '#888',
    textTransform: 'capitalize',
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 16,
  },
  verseContainer: {
    backgroundColor: '#f8fbff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  verseRef: {
    fontWeight: 'bold',
    color: '#4A90E2',
    fontSize: 14,
  },
  verseText: {
    fontStyle: 'italic',
    color: '#555',
    lineHeight: 20,
  },
  skeletonContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#e1e9ee',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#555',
    fontSize: 14,
  },
});
```

---

### What changed and why

| # | Issue (Complected / Insecure) | Refactor |
|---|---|---|
| **1** | **`Math.random()` for like count** — non-deterministic state seeded in render; impossible to test or hydrate from cache. | Replaced with `initialLikeCount` / `initialLiked` props (values in, not randomness). The parent (or a future Service layer) owns the real count. |
| **2** | **Like toggle logic tangled inside JSX event handler** — inline arrow mutating two state atoms with an implicit closure race. | Extracted `toggleLikeState()` — a **pure function** (input → output) testable in plain Node without React. `useCallback` stabilises the handler reference. |
| **3** | **Formatting logic embedded in JSX** — `post.user_id.slice(0,8)`, `new Date(...).toLocaleDateString()`, inline ternary for icon name. | Extracted `formatUsername`, `formatTimestamp`, `visibilityIcon`, `formatLikeCount` — all pure, all exported, all testable with `node --test`. |
| **4** | **Missing error boundary on async fetch** — `BibleService.getVerseText` had no `try/catch`; a network/SQLite error would leave `loadingVerse` stuck `true`. | Added `try/catch/finally` with graceful offline degradation (verse stays `null` → "unavailable offline" text). |
| **5** | **Verse section rendered even when `verse_ref` is absent** — showed an empty blue box with no ref text. | Conditional render: the entire verse block is `null` when `post.verse_ref` is falsy. |
| **6** | **No accessibility annotations** — `TouchableOpacity` buttons had no `accessibilityRole` or labels. | Added `accessibilityRole="button"` and descriptive `accessibilityLabel` to every action. |
| **7** | **Unused `Image` / `ActivityIndicator` imports** — dead code. | Removed. |

> **Next step (when multi-file changes are allowed):** Move `formatUsername`, `formatTimestamp`, `toggleLikeState`, and `visibilityIcon` into `packages/social-engine/src/presentation.ts` so `apps/web` can share them. The like toggle should ultimately call a `SocialService.toggleLike(postId, userId)` that writes through a Repository.