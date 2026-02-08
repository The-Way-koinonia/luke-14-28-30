export interface Post {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    likes_count: number;
    comments_count: number;
    user?: {
        id: string;
        username: string;
        avatar_url: string;
    };
    // Add other fields as needed, syncing with @the-way/types if available
}

export interface SocialAdapter {
  fetchFeed: (limit: number, cursor?: string) => Promise<Post[]>;
  likePost: (postId: string) => Promise<void>;
  createPost: (content: string) => Promise<Post>;
}
