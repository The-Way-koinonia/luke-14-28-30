import { NextResponse } from 'next/server';
import { bibleRepository } from '../../../../lib/db/repositories/bible.repository';

export async function GET() {
  try {
    const books = await bibleRepository.getAllBooks();

    return NextResponse.json({
      success: true,
      data: books
    });
  } catch (error) {
    console.error('Bible books API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}