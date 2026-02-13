

```tsx
// apps/mobile/app/(tabs)/profile.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import ProfileHeader from '@/components/ProfileHeader';
import { SocialPostCard } from '@/components/SocialPostCard';
import ComposePostModal from '@/components/ComposePostModal';
import { Post } from '@/types/social';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';

// ---------------------------------------------------------------------------
// PURE LOGIC — extractable to packages/social-engine in a future step
// ---------------------------------------------------------------------------

/** Derives display-ready profile identity from a raw email string. */
export function deriveProfileIdentity(email: string | undefined): {
  displayName: string;
  username: string;
} {
  const handle = email?.split('@')[0] || 'user';
  return {
    displayName: handle.charAt(0).toUpperCase() + handle.slice(1),
    username: `@${handle}`,
  };
}

/** Computes profile stats from owned posts and (future) social counts. */
export function computeProfileStats(
  postCount: number,
  followers: number,
  following: number,
): { posts: number; followers: number; following: number } {
  return { posts: postCount, followers, following };
}

// ---------------------------------------------------------------------------
// REPOSITORY — extractable to apps/mobile/repositories/social.repo.ts
// ---------------------------------------------------------------------------

/**
 * Fetches all posts authored by `userId`, ordered newest-first.
 * Returns a discriminated result to keep DB errors out of the UI layer.
 */
async function fetchPostsByUserId(
  userId: string,
): Promise<{ data: Post[]; error: string | null }> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: (data ?? []) as Post[], error: null };
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposeVisible, setComposeVisible] = useState(false);

  // Derived values — no state duplication
  const identity = deriveProfileIdentity(session?.user?.email);
  const stats = computeProfileStats(posts.length, 120, 45);

  const loadPosts = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    const result = await fetchPostsByUserId(session.user.id);
    // TODO: surface result.error via toast / observability span
    setPosts(result.data);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // ---- Guard: unauthenticated ----
  if (!session) {
    return (
      <View style={styles.center}>
        <Text>Please log in to view your profile.</Text>
      </View>
    );
  }

  // ---- Render helpers (keep JSX flat) ----
  const renderPost = ({ item }: { item: Post }) => (
    <SocialPostCard post={item} />
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <ProfileHeader
        displayName={identity.displayName}
        username={identity.username}
        stats={stats}
        onEditProfile={() => router.push('/profile/edit')}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>You haven&apos;t posted yet.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Gradient Header Background */}
      <LinearGradient
        colors={[
          Colors.light.brand.gold.DEFAULT,
          Colors.light.brand.purple.DEFAULT,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadPosts}
        />

        {/* FAB — compose */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setComposeVisible(true)}
          accessibilityLabel="Create new post"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>

        <ComposePostModal
          visible={isComposeVisible}
          onClose={() => setComposeVisible(false)}
          onPostSuccess={loadPosts}
        />
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STYLES
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
    height: 150,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.brand.purple.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
```

### What changed & why

| # | Change | Simplicity Rationale |
|---|--------|---------------------|
| 1 | **`deriveProfileIdentity()`** — pure function at top of file | De-complects identity derivation from session shape; testable with a plain string input. |
| 2 | **`computeProfileStats()`** — pure function at top of file | Stats computation is now an explicit contract (`postCount, followers, following → Stats`), not an inline object literal coupled to component state. |
| 3 | **`fetchPostsByUserId()`** — repository-style async function | Isolates DB access (incidental complexity) from UI. Returns a discriminated `{ data, error }` result so the component never touches the Supabase SDK directly. Ready to lift to `apps/mobile/repositories/` next step. |
| 4 | **`useCallback` on `loadPosts`** | Stabilises the function reference so the `useEffect` dependency array is honest and doesn't re-fire on every render. |
| 5 | **Extracted `renderPost`, `renderHeader`, `renderEmpty`** | Keeps the JSX return flat and scannable; each renderer is a named, single-purpose closure. |
| 6 | **Accessibility attributes on FAB** | Security/reliability: `accessibilityLabel` + `accessibilityRole` for screen-reader support (OWASP mobile checklist). |
| 7 | **Guard `session?.user?.id`** before fetch | Prevents a runtime crash if `session` exists but `user` is not yet hydrated. |

> **Next migration step (ADR):** Move `deriveProfileIdentity` → `packages/social-engine/src/profile.ts`, `computeProfileStats` → same package, and `fetchPostsByUserId` → `apps/mobile/repositories/social.repo.ts`.