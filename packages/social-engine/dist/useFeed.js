"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSocialFeed = useSocialFeed;
const react_1 = require("react");
function useSocialFeed(adapter) {
    const [posts, setPosts] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [hasMore, setHasMore] = (0, react_1.useState)(true);
    const loadFeed = (0, react_1.useCallback)(async (isRefresh = false) => {
        if (loading)
            return;
        try {
            if (isRefresh) {
                setRefreshing(true);
            }
            else {
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
            }
            else {
                setHasMore(true);
            }
            if (isRefresh) {
                setPosts(newPosts);
            }
            else {
                // Filter out duplicates just in case
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNewPosts];
                });
            }
        }
        catch (err) {
            setError(err.message || 'Failed to load feed');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [adapter, posts, loading]);
    // Initial Load
    (0, react_1.useEffect)(() => {
        loadFeed(true);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const refresh = (0, react_1.useCallback)(() => {
        loadFeed(true);
    }, [loadFeed]);
    const loadMore = (0, react_1.useCallback)(() => {
        loadFeed(false);
    }, [loadFeed]);
    const createPost = (0, react_1.useCallback)(async (content) => {
        try {
            const newPost = await adapter.createPost(content);
            setPosts(prev => [newPost, ...prev]);
            return newPost;
        }
        catch (err) {
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
