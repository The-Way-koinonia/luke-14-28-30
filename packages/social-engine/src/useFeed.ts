import { useState, useCallback, useEffect } from 'react';
import { SocialAdapter, Post } from './types';

export function useSocialFeed(adapter: SocialAdapter) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (loading) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      // If refreshing, cursor is undefined (start from top).
      // If loading more, use the last post's created_at or id as cursor.
      // NOTE: This assumes 'created_at' is the sort key.
      const cursor = isRefresh ? undefined : posts[posts.length - 1]?.created_at;
      
      // If we are loading more but have no posts, it's essentially a refresh/first load
      if (!isRefresh && !cursor && posts.length > 0) {
          setLoading(false);
          return;
      }

      const limit = 10;
      const newPosts = await adapter.fetchFeed(limit, cursor);

      if (newPosts.length < limit) {
          setHasMore(false);
      } else {
          setHasMore(true);
      }

      if (isRefresh) {
        setPosts(newPosts);
      } else {
        // Filter out duplicates just in case
        setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNewPosts];
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adapter, posts, loading]);

  // Initial Load
  useEffect(() => {
    loadFeed(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    loadFeed(true);
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    loadFeed(false);
  }, [loadFeed]);

  const createPost = useCallback(async (content: string) => {
      try {
          const newPost = await adapter.createPost(content);
          setPosts(prev => [newPost, ...prev]);
          return newPost;
      } catch (err: any) {
          throw err;
      }
  }, [adapter]);

  return {
    posts,
    loading,
    refreshing,
    error,
    refresh,
    loadMore,
    createPost
  };
}
