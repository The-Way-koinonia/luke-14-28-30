import { NextResponse } from 'next/server';
import { WebBibleAdapter } from '@/lib/adapters/webBibleAdapter';

export async function GET() {
  try {
    const books = await WebBibleAdapter.getBooks();

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
