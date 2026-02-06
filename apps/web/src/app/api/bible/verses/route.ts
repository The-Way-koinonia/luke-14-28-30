import { NextResponse } from 'next/server';
import { bibleRepository } from '@/lib/db/repositories/bible.repository';

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
    const verses = await bibleRepository.getVersesByChapter(
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