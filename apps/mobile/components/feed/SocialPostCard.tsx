

```tsx
// apps/mobile/components/feed/SocialPostCard.tsx

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Post } from '@the-way/social-engine';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import VideoPreview from './VideoPreview';
import VerseQuote from './VerseQuote';
import VisualRepost from './VisualRepost';

// ---------------------------------------------------------------------------
// Pure Logic (extracted, testable without React/RN imports)
// ---------------------------------------------------------------------------

/** Default avatar URL used when the post author has no avatar. */
const DEFAULT_AVATAR = 'https://i.pravatar.cc/150';

/** Inactive action icon colour (gray-500). */
const INACTIVE_COLOR = '#6b7280';

/**
 * Derives the display name for a post author.
 *
 * Priority: `full_name` → `username` → static fallback.
 *
 * @param user - The user object attached to the post (may be undefined).
 * @returns A human-readable display name string.
 */
export function resolveDisplayName(
  user: Post['user'] | undefined | null,
): string {
  if (!user) return 'Unknown User';
  // Prefer full_name when it is a non-empty string
  const fullName =
    typeof (user as Record<string, unknown>).full_name === 'string'
      ? ((user as Record<string, unknown>).full_name as string).trim()
      : '';
  if (fullName.length > 0) return fullName;
  return user.username ?? 'Unknown User';
}

/**
 * Resolves the handle string shown beneath the display name.
 *
 * @param user - The user object attached to the post (may be undefined).
 * @returns A string such as `@john_doe` or an empty string when unavailable.
 */
export function resolveHandle(
  user: Post['user'] | undefined | null,
): string {
  if (!user?.username) return '';
  return `@${user.username}`;
}

/**
 * Resolves the avatar URI, falling back to a default placeholder.
 *
 * @param user - The user object attached to the post (may be undefined).
 * @returns A valid image URI string.
 */
export function resolveAvatarUri(
  user: Post['user'] | undefined | null,
): string {
  return user?.avatar_url ?? DEFAULT_AVATAR;
}

/**
 * Determines which media "slot" the post should render.
 *
 * The function returns a discriminated union so the component can
 * pattern-match without embedding decision logic in JSX.
 *
 * @param post - The post to inspect.
 * @returns A tagged media descriptor or `null` when nothing should render.
 */
export type MediaSlot =
  | { kind: 'video'; uri: string }
  | { kind: 'repost'; quotedPost: Post }
  | null;

export function resolveMediaSlot(post: Post): MediaSlot {
  if (post.media_type === 'video' && post.media_url) {
    return { kind: 'video', uri: post.media_url };
  }
  if (post.quoted_post) {
    return { kind: 'repost', quotedPost: post.quoted_post };
  }
  return null;
}

/**
 * Formats a like count for display.
 *
 * Keeps presentation rules (e.g. future abbreviation "1.2k") in a pure fn.
 *
 * @param count - Raw like count (may be undefined).
 * @returns A display-ready string.
 */
export function formatLikeCount(count: number | undefined | null): string {
  return String(count ?? 0);
}

/**
 * Resolves the colour for the "like" icon.
 *
 * @param liked - Whether the current user has liked the post.
 * @returns A colour string.
 */
export function resolveLikeColor(liked: boolean): string {
  return liked ? (Colors.light.brand.primary || 'red') : INACTIVE_COLOR;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SocialPostCardProps {
  /** The post to render. */
  post: Post;
  /** Whether the authenticated user has liked this post. */
  isLiked?: boolean;
  /** Total number of likes. */
  likeCount?: number;
  /** Callback fired when the like button is pressed. */
  onLike?: () => void;
  /** Callback fired when the card body is pressed. */
  onPress?: () => void;
  /** Callback fired when the comment button is pressed. */
  onComment?: () => void;
  /** Callback fired when the repost button is pressed. */
  onRepost?: () => void;
}

/**
 * `SocialPostCard` – renders a single social-feed post.
 *
 * All display-derivation logic is delegated to the pure helper functions
 * above so it can be unit-tested without mounting a React tree.
 */
export default function SocialPostCard({
  post,
  isLiked = false,
  likeCount,
  onLike,
  onPress,
  onComment,
  onRepost,
}: SocialPostCardProps) {
  const displayName = resolveDisplayName(post.user);
  const handle = resolveHandle(post.user);
  const avatarUri = resolveAvatarUri(post.user);
  const mediaSlot = resolveMediaSlot(post);
  const likeLabel = formatLikeCount(likeCount);
  const likeColor = resolveLikeColor(isLiked);

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Post by ${displayName}`}
    >
      <View style={styles.container}>
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            accessibilityIgnoresInvertColors
          />
          <View>
            <Text style={styles.name}>{displayName}</Text>
            {handle.length > 0 && (
              <Text style={styles.username}>{handle}</Text>
            )}
          </View>
        </View>

        {/* ── Content ────────────────────────────────────────── */}
        {post.content ? (
          <Text style={styles.content}>{post.content}</Text>
        ) : null}

        {/* ── Media ──────────────────────────────────────────── */}
        {mediaSlot?.kind === 'video' && (
          <VideoPreview uri={mediaSlot.uri} />
        )}
        {mediaSlot?.kind === 'repost' && (
          <VisualRepost post={mediaSlot.quotedPost} />
        )}

        {/* ── Actions ────────────────────────────────────────── */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onLike}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={likeColor}
            />
            <Text
              style={[
                styles.actionText,
                isLiked && styles.likedText,
              ]}
            >
              {' '}
              {likeLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onComment}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Comment"
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={INACTIVE_COLOR}
            />
            <Text style={styles.actionText}> Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onRepost}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Repost"
          >
            <Ionicons
              name="repeat-outline"
              size={20}
              color={INACTIVE_COLOR}
            />
            <Text style={styles.actionText}> Repost</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    color: '#6b7280',
    fontSize: 14,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingRight: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#6b7280',
    fontSize: 14,
    marginLeft: 4,
  },
  likedText: {
    color: Colors.light.brand.primary || 'red',
    fontWeight: 'bold',
  },
});
```

### What Changed & Why

| # | Change | Simplicity / Security Rationale |
|---|--------|---------------------------------|
| 1 | **Extracted 6 pure functions** (`resolveDisplayName`, `resolveHandle`, `resolveAvatarUri`, `resolveMediaSlot`, `formatLikeCount`, `resolveLikeColor`) to the top of the file. | **De-complect State & Logic.** Every display-derivation rule is now a pure `Input → Output` function testable in plain Node without React Native mocking. |
| 2 | **Introduced `MediaSlot` discriminated union** instead of an inline `renderMedia()` that returns JSX. | Separates the *decision* of what to render (pure data) from the *rendering* itself (JSX). No more logic buried inside an anonymous render function. |
| 3 | **`isLiked` defaults to `false`** via destructuring default. | Eliminates truthy/falsy ambiguity; the component always works with a `boolean`, not `undefined`. |
| 4 | **Added `onComment` and `onRepost` callback props.** | Previously the Comment and Repost buttons had no handlers — silent no-ops that look interactive. Making the callbacks explicit follows the "values over objects" principle (props are the contract). |
| 5 | **Wrapped the card in a `TouchableOpacity` gated on `onPress`** with `disabled` when no handler is provided. | The original `onPress` prop was accepted but never wired up — a subtle bug. |
| 6 | **Added `accessibilityRole` and `accessibilityLabel`** on every interactive element. | Accessibility is a reliability concern; screen-reader users must be able to identify controls. |
| 7 | **Removed hardcoded colour literals from JSX;** extracted `INACTIVE_COLOR` constant and `resolveLikeColor`. | Single source of truth; no silent divergence between the icon colour and the text colour for liked state. |
| 8 | **Full TSDoc on every exported function.** | Execution Protocol §4 — Document. |