

```tsx
// apps/mobile/components/feed/VisualRepost.tsx

import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Post } from "@the-way/social-engine";
import VideoPreview from "./VideoPreview";

// ─────────────────────────────────────────────────────────────────────────────
// PURE LOGIC — extractable to packages/social-engine in a future step
// ─────────────────────────────────────────────────────────────────────────────

/** Default avatar used when the post author has no avatar_url. */
const DEFAULT_AVATAR_URI = "https://i.pravatar.cc/150";

/**
 * Derives a safe, display-ready avatar URI from a Post's user.
 * Returns `DEFAULT_AVATAR_URI` when the value is nullish or empty.
 *
 * @param avatarUrl - The raw `avatar_url` from the user record.
 * @returns A non-empty URI string suitable for `<Image source>`.
 */
export function resolveAvatarUri(
  avatarUrl: string | null | undefined
): string {
  return avatarUrl && avatarUrl.trim().length > 0
    ? avatarUrl.trim()
    : DEFAULT_AVATAR_URI;
}

/**
 * Derives the display name for a post author.
 * Falls back to "Unknown" when username is absent.
 *
 * @param username - The raw username from the user record.
 * @returns A non-empty display string.
 */
export function resolveDisplayName(
  username: string | null | undefined
): string {
  return username && username.trim().length > 0
    ? username.trim()
    : "Unknown";
}

/**
 * Determines whether a post's nested media should be rendered.
 * Keeps the decision logic pure and testable outside React.
 *
 * @param mediaType  - The post's `media_type` field.
 * @param mediaUrl   - The post's `media_url` field.
 * @returns `true` when a video preview should be shown.
 */
export function shouldShowVideoPreview(
  mediaType: string | null | undefined,
  mediaUrl: string | null | undefined
): boolean {
  return mediaType === "video" && typeof mediaUrl === "string" && mediaUrl.trim().length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface VisualRepostProps {
  /** The reposted content to render. Recursive reposts are intentionally omitted. */
  post: Post;
}

/**
 * Renders a compact, single-level preview of a reposted `Post`.
 *
 * Design decisions:
 * - Only one nesting level is rendered to prevent infinite recursion.
 * - Video media is the only nested media type currently supported.
 */
export default function VisualRepost({ post }: VisualRepostProps): React.JSX.Element {
  const avatarUri = resolveAvatarUri(post.user?.avatar_url);
  const displayName = resolveDisplayName(post.user?.username);
  const showVideo = shouldShowVideoPreview(post.media_type, post.media_url);

  return (
    <View style={styles.container}>
      {/* Mini Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatar}
          accessibilityLabel={`${displayName}'s avatar`}
        />
        <Text style={styles.name}>{displayName}</Text>
      </View>

      {/* Content */}
      {post.content ? (
        <Text style={styles.content} numberOfLines={3}>
          {post.content}
        </Text>
      ) : null}

      {/* Nested Media — only one level deep, video only */}
      {showVideo && <VideoPreview uri={post.media_url!} />}

      {/*
       * NOTE: Recursive reposts are intentionally omitted to avoid
       * infinite nesting. Verse quotes can be added here once
       * VerseQuote is wired to the bible-engine package.
       */}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: "#e5e7eb",
  },
  name: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#374151",
  },
  content: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
});
```

### What changed & why

| Concern | Before | After | Rationale |
|---|---|---|---|
| **Avatar fallback** | Inline ternary in JSX (`post.user?.avatar_url \|\| '...'`) | `resolveAvatarUri()` — pure, exported, testable | De-complects display logic from the component tree. |
| **Username fallback** | Raw `post.user?.username` (could render `undefined`) | `resolveDisplayName()` — pure, exported, testable | Prevents rendering `undefined`/empty text; single responsibility. |
| **Media gate** | Inline `&&` chain in JSX | `shouldShowVideoPreview()` — pure, exported, testable | Decision logic is now testable in a plain Node script without mocking React Native. |
| **Null content** | Always rendered `<Text>` even when `post.content` is falsy | Conditional render (`post.content ? … : null`) | Avoids rendering an empty `<Text>` node. |
| **Accessibility** | None | `accessibilityLabel` on avatar `<Image>` | Baseline a11y improvement. |
| **Unused import** | `Colors`, `VerseQuote` imported but never used | Removed | Eliminates dead code; keeps the dependency graph honest. |
| **TSDoc** | None | Every exported function documented | Matches execution protocol documentation requirement. |
| **Security** | N/A (no SQL/API) | `.trim()` guards prevent whitespace-only URIs from leaking through | Defense-in-depth for display values. |

All three extracted functions can be moved verbatim into `packages/social-engine` in a future step with zero changes to their signatures.