import { NextResponse } from 'next/server';
import { bibleRepository } from '@/lib/db/repositories/bible.repository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const bookId = searchParams.get('bookId');
  const chapter = searchParams.get('chapter');
  const verse = searchParams.get('verse');
  const translation = searchParams.get('translation') || 'KJV';

  try {
    // Get single verse
    if (bookId && chapter && verse) {
      const verseData = await bibleRepository.getVerse(
        parseInt(bookId),
        parseInt(chapter),
        parseInt(verse),
        translation
      );

      if (!verseData) {
        return NextResponse.json(
          { error: 'Verse not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ verse: verseData });
    }

    // Get full chapter
    if (bookId && chapter) {
      const verses = await bibleRepository.getChapter(
        parseInt(bookId),
        parseInt(chapter),
        translation
      );

      return NextResponse.json({ verses, count: verses.length });
    }

    // Missing required parameters
    return NextResponse.json(
      { error: 'Missing required parameters: bookId and chapter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Bible verses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verses' },
      { status: 500 }
    );
  }
}
