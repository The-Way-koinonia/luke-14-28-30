import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');
  const bookName = searchParams.get('book');

  if (!word || !bookName) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // 1. Determine Testament based on Book Name
    // (Simple heuristic: first 39 books are OT, rest are NT)
    const bookRes = await db.query(
      'SELECT id FROM "KJV_books" WHERE name = $1', 
      [bookName]
    );
    
    if (bookRes.rows.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    
    const bookId = bookRes.rows[0].id;
    const isOldTestament = bookId <= 39;
    const tableName = isOldTestament ? 'strongs_hebrew' : 'strongs_greek';

    // 2. Clean the word for search (remove punctuation)
    const cleanWord = word.replace(/[.,;:!?'"()[\]{}]/g, '').trim();

    // 3. Perform Smart Search
    // We look for definitions that CONTAIN the English word or match the transliteration
    const query = `
      SELECT 
        strongs_number,
        lemma,
        transliteration,
        pronunciation,
        definition
      FROM ${tableName}
      WHERE 
        definition ILIKE $1 
        OR 
        transliteration ILIKE $1
      ORDER BY 
        LENGTH(definition) ASC
      LIMIT 5
    `;

    const matches = await db.query(query, [`%${cleanWord}%`]);

    return NextResponse.json({
      success: true,
      data: matches.rows.length > 0 ? matches.rows[0] : null, // Return best match
      alternatives: matches.rows.slice(1) // Send others just in case
    });

  } catch (error) {
    console.error('Strongs API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}