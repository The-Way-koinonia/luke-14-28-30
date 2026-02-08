import { SocialAdapter, Post } from '@the-way/social-engine';
import { supabase } from '@/lib/supabase';

export const MobileSocialAdapter: SocialAdapter = {
  fetchFeed: async (limit: number, cursor?: string) => {
    let query = supabase
      .from('posts')
      .select(`
        *,
        user:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return data as Post[];
  },

  likePost: async (postId: string) => {
    // Implement like logic here
    // For now, just a placeholder or basic increment if you have an RPC or edge function
    // Or a direct insert into a 'likes' table
    console.log('Like post:', postId);
  },

  createPost: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
            content,
            user_id: user.id
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
    return data as Post;
  }
};
