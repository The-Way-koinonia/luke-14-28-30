import { NextResponse } from 'next/server';
import { WebBibleAdapter } from '@/lib/adapters/webBibleAdapter';

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

    // Get verses for the chapter
    const verses = await WebBibleAdapter.getChapterVerses(
      parseInt(bookId),
      parseInt(chapter)
    );

    if (!verses || !Array.isArray(verses) || verses.length === 0) {
      return NextResponse.json(
        { error: 'No verses found for this chapter' },
        { status: 404 }
      );
    }

    // If specific verse requested, filter to that verse
    if (verseNum) {
      const singleVerse = verses.find(v => v.verse === parseInt(verseNum));
      return NextResponse.json({
        success: true,
        verses: singleVerse ? [singleVerse] : []
      });
    }

    return NextResponse.json({
      success: true,
      verses
    });

  } catch (error) {
    console.error('Bible verses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verses' },
      { status: 500 }
    );
  }
}