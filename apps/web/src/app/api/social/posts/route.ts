
import { NextRequest, NextResponse } from 'next/server';
import { SocialService } from '@/lib/services/social.service';

/**
 * @swagger
 * /api/social/posts:
 *   post:
 *     summary: Create a new post
 *     description: Creates a new social post with optional media
 *     tags:
 *       - Social
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               media_type:
 *                 type: string
 *                 enum: [text, image, video]
 *     responses:
 *       200:
 *         description: Post created successfully
 *       400:
 *         description: Missing content
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    const { content, media_type } = await request.json();

    // Get Auth Token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const post = await SocialService.createPost(token || null, content, media_type);

    return NextResponse.json(post);
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes('Validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
