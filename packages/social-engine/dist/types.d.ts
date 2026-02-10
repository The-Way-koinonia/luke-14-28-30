export interface Post {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    likes_count: number;
    comments_count: number;
    media_type?: 'text' | 'image' | 'video' | 'audio';
    media_url?: string;
    quoted_post?: Post;
    quoted_post_id?: string;
    user?: {
        id: string;
        username: string;
        avatar_url: string;
    };
}
export interface SocialAdapter {
    fetchFeed: (limit: number, cursor?: string) => Promise<Post[]>;
    likePost: (postId: string) => Promise<void>;
    createPost: (content: string) => Promise<Post>;
}
