
import { NextRequest, NextResponse } from 'next/server';
import { SocialService } from '@/lib/services/social.service';

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
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const cursor = searchParams.get('cursor'); // 'undefined' check handled in Service
    const type = searchParams.get('type') || 'global';

    // Get Auth Token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const posts = await SocialService.getFeed(type, limit, cursor, token);

    return NextResponse.json(posts);
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
