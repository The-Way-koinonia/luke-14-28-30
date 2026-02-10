import { SocialAdapter, Post } from './types';
export declare function useSocialFeed(adapter: SocialAdapter): {
    posts: Post[];
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    refresh: () => void;
    loadMore: () => void;
    createPost: (content: string) => Promise<Post>;
};
