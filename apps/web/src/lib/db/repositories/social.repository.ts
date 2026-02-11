import { SupabaseClient } from '@supabase/supabase-js';
import { Post } from '@the-way/types';

export class SocialRepository {
  /**
   * Retrieves the social feed based on filters.
   */
  static async getFeed(
    client: SupabaseClient,
    options: {
      limit: number;
      cursor?: string;
      userIds?: string[]; // For 'following' feed
      mediaType?: string;
    }
  ): Promise<Post[]> {
    let query = client
      .from('posts')
      .select(`
        *,
        user:user_id (
          id,
          username,
          avatar_url
        ),
        likes:likes(count),
        comments:comments(count)
      `) // Improved selection to match Post type more closely if generic, but sticking to existing logic mostly
      .order('created_at', { ascending: false })
      .limit(options.limit);

    if (options.userIds) {
      query = query.in('user_id', options.userIds);
    }
    
    if (options.mediaType) {
      query = query.eq('media_type', options.mediaType);
    }

    if (options.cursor) {
      query = query.lt('created_at', options.cursor);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Map response to match strict Post type if necessary, 
    // or rely on Supabase returning compatible shape (it usually does if schema matches).
    // For now assuming the joining matches.
    return data as unknown as Post[];
  }

  /**
   * Creates a new post.
   */
  static async createPost(
    client: SupabaseClient,
    post: {
      userId: string;
      content: string;
      mediaType: 'text' | 'image' | 'video';
    }
  ): Promise<Post> {
    const { data, error } = await client
      .from('posts')
      .insert({
        content: post.content,
        user_id: post.userId,
        media_type: post.mediaType
      })
      .select(`
        *,
        user:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data as unknown as Post;
  }

  /**
   * Get IDs of users the current user follows.
   */
  static async getFollowingIds(client: SupabaseClient, followerId: string): Promise<string[]> {
    const { data, error } = await client
      .from('follows')
      .select('following_id')
      .eq('follower_id', followerId);

    if (error) throw error;
    return data ? data.map((f: any) => f.following_id) : [];
  }
}
