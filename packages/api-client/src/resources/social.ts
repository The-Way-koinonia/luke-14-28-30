import { ApiClient } from '../client';
import { Post, ApiResponse, PaginatedResponse } from '@the-way/types';

export class SocialResource {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async getPosts(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    return this.client.fetch<PaginatedResponse<Post>>(`/social/posts?page=${page}&limit=${limit}`);
  }

  async createPost(content: string): Promise<ApiResponse<Post>> {
    return this.client.fetch<ApiResponse<Post>>('/social/posts', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async likePost(postId: string): Promise<ApiResponse<void>> {
    return this.client.fetch<ApiResponse<void>>(`/social/likes`, {
      method: 'POST',
      body: JSON.stringify({ postId }),
    });
  }
}
