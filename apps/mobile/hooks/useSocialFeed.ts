import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Adjust this path to your actual Supabase client instance
import { Post, CreatePostDTO, PostVisibility } from '../types/social';
import { handleSupabaseError } from '../utils/security';

export const useSocialFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMfaRequired, setIsMfaRequired] = useState(false);

  // Fetch initial posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error);
        return;
      }

      if (data) {
        setPosts(data as Post[]);
      }
    } catch (err) {
      console.error('Unexpected error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new post
  const createPost = async ({ content, verse_ref, visibility }: CreatePostDTO) => {
    setIsMfaRequired(false); // Reset state
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          user_id: user.id,
          content,
          verse_ref,
          visibility,
        },
      ])
      .select()
      .single();

    if (error) {
      const handled = handleSupabaseError(error, () => setIsMfaRequired(true));
      if (!handled) {
          // If not handled as MFA/RLS specifically, it might be another error
          // handleSupabaseError already does an alert or log
      }
      return null;
    }

    return data as Post;
  };

  // Realtime subscription
  useEffect(() => {
    fetchPosts();

    const subscription = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
           // Optimistic update handling or simply re-fetch
           // For simple implementation, we can re-fetch or append locally
           console.log('Realtime change received!', payload);
           
           if (payload.eventType === 'INSERT') {
             setPosts((prev) => [payload.new as Post, ...prev]);
           } else if (payload.eventType === 'DELETE') {
             setPosts((prev) => prev.filter(p => p.id !== payload.old.id));
           } else if (payload.eventType === 'UPDATE') {
              setPosts((prev) => prev.map(p => p.id === payload.new.id ? (payload.new as Post) : p));
           }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    posts,
    loading,
    createPost,
    isMfaRequired,
    refresh: fetchPosts,
  };
};
