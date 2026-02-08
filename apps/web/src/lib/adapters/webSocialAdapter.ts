import { SocialAdapter, Post } from '@the-way/social-engine';

export const WebSocialAdapter: SocialAdapter = {
  fetchFeed: async (limit: number, cursor?: string) => {
    try {
      // Construct URL with query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
      });
      if (cursor) {
        params.append('cursor', cursor);
      }
      
      const res = await fetch(`/api/social/feed?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch feed: ${res.statusText}`);
      }
      
      const data = await res.json();
      return data as Post[];
    } catch (error) {
      console.error('Error fetching web feed:', error);
      throw error;
    }
  },

  likePost: async (postId: string) => {
    try {
      const res = await fetch(`/api/social/posts/${postId}/like`, { 
        method: 'POST' 
      });
      
      if (!res.ok) {
        throw new Error('Failed to like post');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  createPost: async (content: string) => {
      try {
        const res = await fetch('/api/social/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });

        if (!res.ok) {
          throw new Error('Failed to create post');
        }

        const data = await res.json();
        return data as Post;
      } catch (error) {
        console.error('Error creating post:', error);
        throw error;
      }
  }
};
