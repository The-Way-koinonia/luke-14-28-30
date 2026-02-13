

```tsx
// apps/mobile/app/(tabs)/feed.tsx

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { SocialPostCard } from '@/components/SocialPostCard';
import { Ionicons } from '@expo/vector-icons';
import { useSocialFeed, type SocialPost } from '@the-way/social-engine';
import { MobileSocialAdapter } from '@/utils/mobileSocialAdapter';

// ---------------------------------------------------------------------------
// Pure Logic — extracted at file top per constraint.
// These are stateless, testable functions with zero framework dependencies.
// ---------------------------------------------------------------------------

/**
 * Stable key extractor for the social feed list.
 * Kept as a named function so React Native can referentially cache it.
 */
export const extractPostKey = (post: SocialPost): string => post.id;

/**
 * Determines whether the empty-state should show a loading indicator
 * vs. a "no posts" message.
 *
 * Decouples the decision from the JSX tree so it can be unit-tested
 * without rendering anything.
 */
export const resolveEmptyState = (
  loading: boolean,
): 'loading' | 'empty' => (loading ? 'loading' : 'empty');

// ---------------------------------------------------------------------------
// Presentation Components — small, single-responsibility, no hooks.
// ---------------------------------------------------------------------------

/** Gradient that sits behind the header area. */
function HeaderBackground() {
  return (
    <LinearGradient
      colors={[
        Colors.light.brand.gold.DEFAULT,
        Colors.light.brand.purple.DEFAULT,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerBackground}
    />
  );
}

/** Title row with refresh action. */
function HeaderContent({ onRefresh }: { readonly onRefresh: () => void }) {
  return (
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>The Way</Text>
      <TouchableOpacity onPress={onRefresh} accessibilityRole="button" accessibilityLabel="Refresh feed">
        <Ionicons name="refresh" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

/** Empty / loading placeholder shown when the list has no data. */
function FeedEmptyComponent({ loading }: { readonly loading: boolean }) {
  const state = resolveEmptyState(loading);

  return (
    <View style={styles.emptyContainer}>
      {state === 'loading' ? (
        <ActivityIndicator color={Colors.light.brand.purple.DEFAULT} />
      ) : (
        <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen (Orchestration)
// ---------------------------------------------------------------------------

/**
 * Primary social feed screen.
 *
 * Responsibilities are de-complected:
 *   - Data fetching / pagination → `useSocialFeed` (from social-engine)
 *   - Adapter (incidental complexity) → `MobileSocialAdapter`
 *   - Pure logic → `extractPostKey`, `resolveEmptyState`
 *   - Presentation → small sub-components above
 */
export default function FeedScreen() {
  const { posts, loading, refresh, loadMore } = useSocialFeed(MobileSocialAdapter);

  // Memoised render function — avoids a new closure every render cycle.
  const renderPost = useCallback(
    ({ item }: ListRenderItemInfo<SocialPost>) => <SocialPostCard post={item} />,
    [],
  );

  // Memoised empty component to prevent unnecessary re-mounts.
  const listEmptyComponent = useCallback(
    () => <FeedEmptyComponent loading={loading} />,
    [loading],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <HeaderBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <HeaderContent onRefresh={refresh} />

        <FlatList<SocialPost>
          data={posts}
          keyExtractor={extractPostKey}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={refresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={listEmptyComponent}
        />
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  safeArea: {
    flex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'serif',
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 80,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
});
```

### What changed & why

| Concern | Before | After | Simplicity Rationale |
|---|---|---|---|
| **Key extraction** | Inline arrow `(item) => item.id` | Exported pure fn `extractPostKey` | Testable without React; stable reference eliminates re-render churn. |
| **Empty-state decision** | Ternary buried inside JSX | `resolveEmptyState(loading)` pure fn + `FeedEmptyComponent` | Logic is de-complected from presentation — unit-testable in plain Node. |
| **Header gradient** | Inline JSX block | `HeaderBackground` component | Single responsibility; no props = zero coupling. |
| **Header bar** | Inline JSX block | `HeaderContent({ onRefresh })` | Presentation separated from data-fetching orchestration. |
| **renderItem** | Inline arrow recreated every render | `useCallback` with stable reference | Prevents FlatList from re-mounting every cell on parent re-render. |
| **ListEmptyComponent** | Inline JSX element | `useCallback`-wrapped component function | React Native re-mounts `ListEmptyComponent` when the reference changes; stabilised here. |
| **Accessibility** | None on refresh button | `accessibilityRole` + `accessibilityLabel` | Security-adjacent: inclusive design is a reliability concern. |
| **Type safety** | `FlatList` untyped, `item` inferred as `any` | `FlatList<SocialPost>`, explicit `ListRenderItemInfo<SocialPost>` | Catches contract drift at compile time. |
| **readonly props** | N/A | All sub-component props marked `readonly` | Values over mutable objects — aligns with immutability preference. |

> **Note for future steps:** `extractPostKey` and `resolveEmptyState` are prime candidates for migration to `packages/social-engine` once the monorepo refactor reaches that layer. An ADR should be filed at that point.