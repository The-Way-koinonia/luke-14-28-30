

```tsx
// apps/mobile/components/feed/SmartFeedList.tsx

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Post } from '@the-way/social-engine';
import PostSkeleton from './PostSkeleton';
import SocialPostCard from './SocialPostCard';
import { Colors } from '@/constants/theme';

// ---------------------------------------------------------------------------
// PURE LOGIC: Extracted & testable without any React/RN imports.
// These functions operate on plain values and return plain values.
// ---------------------------------------------------------------------------

/** Represents the optimistic UI state for a single post's "like" interaction. */
export interface OptimisticLikeState {
  readonly count: number;
  readonly liked: boolean;
}

/** An immutable map of Post ID → OptimisticLikeState. */
export type OptimisticLikesMap = Readonly<Record<string, OptimisticLikeState>>;

/**
 * Resolves the current like state for a post by merging the server-truth
 * (`Post`) with any optimistic override.
 *
 * Pure function – no side-effects.
 *
 * @param post          - The canonical post data from the server/cache.
 * @param optimistic    - An optional optimistic override, if one exists.
 * @returns A resolved `{ count, liked }` tuple.
 */
export function resolveLikeState(
  post: Pick<Post, 'likes_count' | 'is_liked'>,
  optimistic: OptimisticLikeState | undefined,
): OptimisticLikeState {
  if (optimistic) {
    return optimistic;
  }
  return {
    count: post.likes_count ?? 0,
    liked: post.is_liked ?? false,
  };
}

/**
 * Computes the next optimistic-likes map after toggling a single post's
 * like status.
 *
 * Pure function – no side-effects, no mutation.
 *
 * @param postId        - The ID of the post being toggled.
 * @param currentState  - The resolved like state *before* the toggle.
 * @param prev          - The previous optimistic-likes map.
 * @returns A new `OptimisticLikesMap` with the toggled entry.
 */
export function computeOptimisticToggle(
  postId: string,
  currentState: OptimisticLikeState,
  prev: OptimisticLikesMap,
): OptimisticLikesMap {
  const newLiked = !currentState.liked;
  const newCount = currentState.liked
    ? Math.max(currentState.count - 1, 0)
    : currentState.count + 1;

  return {
    ...prev,
    [postId]: { count: newCount, liked: newLiked },
  };
}

/**
 * Determines whether the feed should display the skeleton loading state.
 *
 * @param loading    - Whether a fetch is in-flight.
 * @param refreshing - Whether a pull-to-refresh is active.
 * @param dataLength - The number of posts currently held.
 */
export function shouldShowSkeleton(
  loading: boolean,
  refreshing: boolean,
  dataLength: number,
): boolean {
  return loading && !refreshing && dataLength === 0;
}

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const SKELETON_COUNT = 5;
const ESTIMATED_ITEM_SIZE = 150;
const END_REACHED_THRESHOLD = 0.5;
const FEED_BG = '#f3f4f6';

// ---------------------------------------------------------------------------
// COMPONENT PROPS
// ---------------------------------------------------------------------------

interface SmartFeedProps {
  readonly data: Post[];
  readonly loading?: boolean;
  readonly refreshing?: boolean;
  readonly onRefresh?: () => void;
  readonly onEndReached?: () => void;
  readonly onPressPost?: (post: Post) => void;
  /** Async side-effect for persisting a like toggle. Receives post ID and the new desired liked state. */
  readonly onToggleLike?: (postId: string, liked: boolean) => Promise<void>;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

/**
 * A performant, offline-friendly social feed list with optimistic like
 * toggling and skeleton loading states.
 */
export default function SmartFeedList({
  data,
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  onPressPost,
  onToggleLike,
}: SmartFeedProps) {
  const [optimisticLikes, setOptimisticLikes] = useState<OptimisticLikesMap>({});

  const handleLike = useCallback(
    (post: Post) => {
      const current = resolveLikeState(post, optimisticLikes[post.id]);
      const newLiked = !current.liked;

      // 1. Optimistic update (sync, immediate)
      setOptimisticLikes((prev) => computeOptimisticToggle(post.id, current, prev));

      // 2. Persist via injected side-effect; revert on failure.
      onToggleLike?.(post.id, newLiked).catch(() => {
        // Revert to the state we had *before* this toggle.
        setOptimisticLikes((prev) => ({
          ...prev,
          [post.id]: current,
        }));
      });
    },
    [optimisticLikes, onToggleLike],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => {
      const { count, liked } = resolveLikeState(item, optimisticLikes[item.id]);

      return (
        <SocialPostCard
          post={item}
          isLiked={liked}
          likeCount={count}
          onLike={() => handleLike(item)}
          onPress={() => onPressPost?.(item)}
        />
      );
    },
    [optimisticLikes, handleLike, onPressPost],
  );

  // --- Skeleton gate ---
  if (shouldShowSkeleton(loading, refreshing, data.length)) {
    return (
      <View style={styles.skeletonContainer}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <PostSkeleton key={i} />
        ))}
      </View>
    );
  }

  const tintColor = Colors.light.brand.primary ?? '#6366f1';

  return (
    <View style={styles.container}>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        onEndReached={onEndReached}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
          />
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FEED_BG,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: FEED_BG,
  },
});
```

### What changed & why

| Concern | Before (Complected) | After (Simple) |
|---|---|---|
| **Like resolution** | Inlined ternaries scattered across `handleLike` and `renderItem` mixed UI state reading with domain logic. | Extracted to **`resolveLikeState`** — a pure function that takes a `Post` + optional override and returns a value. Testable in Node without React. |
| **Optimistic toggle computation** | Mutation logic embedded inside a `setState` callback with raw arithmetic. | Extracted to **`computeOptimisticToggle`** — pure, returns a new map. Ensures `count` never goes below 0 (bug fix). |
| **Skeleton display decision** | Boolean expression inlined in JSX control flow. | Extracted to **`shouldShowSkeleton`** — trivially unit-testable. |
| **Side-effect (API call)** | Hardcoded `console.log` / `// TODO` inside the component. The component *was* the service. | **Dependency-injected** via `onToggleLike` prop (a `(postId, liked) => Promise<void>`). The component doesn't know about Supabase, REST, or expo-sqlite. The caller (screen/service layer) owns the side-effect. On rejection the optimistic state **reverts** automatically. |
| **Render performance** | `renderItem`, `handleLike` recreated every render; no `keyExtractor`. | Wrapped in `useCallback` with correct dependency arrays; `keyExtractor` added for FlashList identity stability. |
| **Magic values** | `150`, `0.5`, `5`, `'#f3f4f6'` scattered in JSX. | Hoisted to named constants (`ESTIMATED_ITEM_SIZE`, `END_REACHED_THRESHOLD`, `SKELETON_COUNT`, `FEED_BG`). |
| **Skeleton array** | Five copy-pasted `<PostSkeleton />` elements. | `Array.from` with a constant — DRY and easy to tune. |
| **Immutability** | Props interface used mutable fields. | All props marked `readonly`. `OptimisticLikesMap` is `Readonly<Record<…>>`. |
| **Documentation** | None. | TSDoc on every exported function and interface. |