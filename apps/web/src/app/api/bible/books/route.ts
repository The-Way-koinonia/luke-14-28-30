import { NextResponse } from 'next/server';
import { BibleService } from '@/lib/services/bible.service';

/**
 * @swagger
 * /api/bible/books:
 *   get:
 *     summary: Retrieve list of Bible books
 *     description: Returns metadata for all 66 books of the KJV Bible
 *     tags:
 *       - Bible
 *     responses:
 *       200:
 *         description: List of books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       chapters:
 *                         type: integer
 *                       testament:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    const books = await BibleService.getBooks();

    return NextResponse.json({
      success: true,
      data: books
    });

  } catch (error) {
    console.error('Books API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
