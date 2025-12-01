import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const result = await db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM bible_verses'
    );

    const booksResult = await db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM bible_books'
    );

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        verses: result?.count || 0,
        books: booksResult?.count || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
