import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');
  const bookName = searchParams.get('book');
  const chapter = searchParams.get('chapter');
  const verse = searchParams.get('verse');

  if (!word || !bookName || !chapter || !verse) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // 1. Get Book ID (You might want a cache or helper for this)
    const bookRes = await db.query(
      'SELECT id FROM "KJV_books" WHERE name = $1', 
      [bookName]
    );
    
    if (bookRes.rows.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    const bookId = bookRes.rows[0].id;

    // 2. Find the Strong's definition for this word in this specific verse context
    // We match roughly on the word text to find the correct position
    const strongsRes = await db.query(`
      SELECT 
        vw.strongs_number,
        COALESCE(sg.lemma, sh.lemma) as lemma,
        COALESCE(sg.transliteration, sh.transliteration) as transliteration,
        COALESCE(sg.pronunciation, sh.pronunciation) as pronunciation,
        COALESCE(sg.definition, sh.definition) as definition
      FROM verse_words vw
      LEFT JOIN strongs_greek sg ON vw.strongs_number = sg.strongs_number
      LEFT JOIN strongs_hebrew sh ON vw.strongs_number = sh.strongs_number
      WHERE vw.book_id = $1 
        AND vw.chapter = $2 
        AND vw.verse = $3 
        AND LOWER(vw.word_text) = LOWER($4)
      LIMIT 1
    `, [bookId, chapter, verse, word.replace(/[.,;:!?]/g, '')]);

    if (strongsRes.rows.length === 0) {
      return NextResponse.json({ 
        found: false, 
        message: 'No Strong\'s data found for this word' 
      });
    }

    return NextResponse.json({
      success: true,
      data: strongsRes.rows[0]
    });

  } catch (error) {
    console.error('Strongs API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}