
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Fix for dynamic route params type
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
type Props = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * @swagger
 * /api/social/posts/{id}/like:
 *   post:
 *     summary: Toggle like on a post
 *     description: Likes or unlikes a post based on current state
 *     tags:
 *       - Social
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to like/unlike
 *     responses:
 *       200:
 *         description: Like status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 */
export async function POST(
  request: NextRequest,
  props: Props
) {
  const params = await props.params;
  const postId = params.id;

  try {
     // Get Auth Token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        return NextResponse.json({ error: 'Missing Authorization Header' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if like exists
    const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

    if (existingLike) {
        // Unlike
        const { error } = await supabase
            .from('likes')
            .delete()
            .eq('id', existingLike.id);
        
        if (error) throw error;
        return NextResponse.json({ liked: false });
    } else {
        // Like
        const { error } = await supabase
            .from('likes')
            .insert({
                user_id: user.id,
                post_id: postId
            });
        
        if (error) throw error;
        return NextResponse.json({ liked: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
