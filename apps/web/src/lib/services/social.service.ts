import { supabase } from '@/lib/supabase';
import { SocialRepository } from '../db/repositories/social.repository';
import { Post } from '@the-way/types';

export class SocialService {
  /**
   * Retrieves the feed. Handles auth for 'following' feed.
   */
  static async getFeed(
    type: string = 'global',
    limit: number = 10,
    cursor?: string | null,
    token?: string | null
  ): Promise<Post[]> {
    let userIds: string[] | undefined;
    let currentUser = null;

    // Validate Auth if needed
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      currentUser = data.user;
    }

    // Logic for 'following' feed
    if (type === 'following') {
      if (!currentUser) {
        throw new Error('Unauthorized: Authentication required for following feed');
      }
      
      userIds = await SocialRepository.getFollowingIds(supabase, currentUser.id);
      
      // If following no one, return empty immediately
      if (userIds.length === 0) {
        return [];
      }
    }

    const mediaType = type === 'video' ? 'video' : undefined;
    const safeCursor = (cursor && cursor !== 'undefined' && cursor !== 'null') ? cursor : undefined;

    // Pass the global client (or authenticated client if we had one) to repo
    return await SocialRepository.getFeed(supabase, {
      limit,
      cursor: safeCursor,
      userIds,
      mediaType
    });
  }

  /**
   * Creates a new post. Requires valid auth token.
   */
  static async createPost(
    token: string | null,
    content: string,
    mediaType: 'text' | 'image' | 'video' = 'text'
  ): Promise<Post> {
    if (!token) {
      throw new Error('Unauthorized: Missing token');
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    if (!content) {
      throw new Error('Validation Error: Content is required');
    }

    return await SocialRepository.createPost(supabase, {
      userId: user.id,
      content,
      mediaType
    });
  }
}
