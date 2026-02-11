
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/social/feed:
 *   get:
 *     summary: Retrieve the social feed
 *     description: Returns a list of posts based on filter type (global, following, video)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [global, following, video]
 *         description: Type of feed to retrieve
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of posts to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Pagination cursor (created_at)
 *     responses:
 *       200:
 *         description: A list of posts
 *       401:
 *         description: Unauthorized (required for 'following' feed)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');
  const cursor = searchParams.get('cursor');
  const type = searchParams.get('type') || 'global';

  // Get Auth Token
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  let user = null;
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    user = data.user;
  }

  // Handle "Following" Feed
  let followingIds: string[] = [];
  if (type === 'following') {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch followed users
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (follows) {
      followingIds = follows.map(f => f.following_id);
      // If following no one, return empty or global? Bluesky shows empty.
      if (followingIds.length === 0) {
        return NextResponse.json([]);
      }
    }
  }

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

  // Apply Type Filter
  if (type === 'following') {
    query = query.in('user_id', followingIds);
  } else if (type === 'video') {
    query = query.eq('media_type', 'video');
  }

  if (cursor && cursor !== 'undefined' && cursor !== 'null') {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
