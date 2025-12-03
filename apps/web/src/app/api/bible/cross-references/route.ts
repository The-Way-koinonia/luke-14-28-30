import { NextRequest, NextResponse } from 'next/server';
import { pool } from "/Users/colinmontes/The Way/The Way/apps/web/src/lib/db/index"
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const book = searchParams.get('book');
    const chapter = searchParams.get('chapter');
    const verse = searchParams.get('verse');

    if (!book || !chapter || !verse) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the book_id from the book name
    const bookResult = await pool.query(  // ← Add .query here
      'SELECT id FROM bible_books WHERE name = $1',
      [book]
    );

    if (bookResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    } 

    const bookId = bookResult.rows[0].id;

    // Fetch cross-references for this verse
    const crossRefsResult = await pool.query(  // ← Add .query here
      `SELECT 
        bb.name as to_book,
        cr.to_chapter,
        cr.to_verse_start,
        cr.to_verse_end,
        cr.votes,
        bv.text as verse_text
      FROM cross_references cr
      JOIN bible_books bb ON cr.to_book_id = bb.id
      LEFT JOIN bible_verses bv ON bv.book_id = cr.to_book_id 
        AND bv.chapter = cr.to_chapter 
        AND bv.verse = cr.to_verse_start
      WHERE cr.from_book_id = $1 
        AND cr.from_chapter = $2 
        AND cr.from_verse = $3
      ORDER BY cr.votes DESC
      LIMIT 20`,
      [bookId, chapter, verse]
    );

    return NextResponse.json({
      success: true,
      references: crossRefsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching cross-references:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cross-references' },
      { status: 500 }
    );
  }
}