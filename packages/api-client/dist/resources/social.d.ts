import { ApiClient } from '../client';
import { Post, ApiResponse, PaginatedResponse } from '@the-way/types';
export declare class SocialResource {
    private client;
    constructor(client: ApiClient);
    getPosts(page?: number, limit?: number): Promise<PaginatedResponse<Post>>;
    createPost(content: string): Promise<ApiResponse<Post>>;
    likePost(postId: string): Promise<ApiResponse<void>>;
}
