import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get all books with chapter counts
    const books = await db.query(`
      SELECT 
        b.id,
        b.name,
        MAX(v.chapter) as chapters,
        CASE 
          WHEN b.id <= 39 THEN 'OT'
          ELSE 'NT'
        END as testament
      FROM "KJV_books" b
      LEFT JOIN "KJV_verses" v ON b.id = v.book_id
      GROUP BY b.id, b.name
      ORDER BY b.id
    `);

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
