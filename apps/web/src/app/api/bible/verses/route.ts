import { NextResponse } from 'next/server';
import { BibleService } from '@/lib/services/bible.service';

/**
 * @swagger
 * /api/bible/verses:
 *   get:
 *     summary: Retrieve Bible verses
 *     description: Returns verses for a specific chapter or single verse
 *     tags:
 *       - Bible
 *     parameters:
 *       - in: query
 *         name: bookId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the Bible book (1-66)
 *       - in: query
 *         name: chapter
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chapter number
 *       - in: query
 *         name: verse
 *         schema:
 *           type: integer
 *         description: Optional verse number
 *     responses:
 *       200:
 *         description: Verses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 verses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       text:
 *                         type: string
 *                       verse:
 *                         type: integer
 *       400:
 *         description: Missing bookId or chapter
 *       404:
 *         description: No verses found
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const chapter = searchParams.get('chapter');
    const verseNum = searchParams.get('verse');

    if (!bookId || !chapter) {
      return NextResponse.json(
        { error: 'Missing required parameters: bookId and chapter' },
        { status: 400 }
      );
    }

    const verses = await BibleService.getVerses(
      parseInt(bookId),
      parseInt(chapter),
      verseNum ? parseInt(verseNum) : undefined
    );

    return NextResponse.json({
      success: true,
      verses
    });

  } catch (error: any) {
    console.error('Bible verses API error:', error);
    
    // Handle "Not Found" error specifically if defined, otherwise generic 500
    if (error.message === 'No verses found for this chapter') {
         return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch verses' },
      { status: 500 }
    );
  }
}