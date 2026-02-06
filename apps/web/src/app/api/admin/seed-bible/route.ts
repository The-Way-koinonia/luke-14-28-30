import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// Standard Protestant Bible book order for mapping
// If the DB has different IDs, we should query KJV_books first.
// For now, let's fetch the books from the DB to be safe.

export async function POST(request: Request) {
  try {
    const jsonPath = path.join(process.cwd(), 'src/data/KJV_test.json');
    console.log('Reading KJV data from:', jsonPath);
    
    const fileContent = await fs.readFile(jsonPath, 'utf-8');
    const kjvData = JSON.parse(fileContent);

    // 1. Fetch existing books to create a Name -> ID map
    const books = await db.query<{ id: number; name: string }>('SELECT id, name FROM "KJV_books"');
    const bookMap = new Map<string, number>();
    books.forEach(b => bookMap.set(b.name, b.id));

    console.log(`Found ${books.length} books in DB.`);

    let updatedCount = 0;
    const errors: string[] = [];

    // 2. Iterate and update
    // We'll use a transaction for safety and speed? 
    // Actually, simple sequential updates in a single connection query might be simplest to implement here without complex transaction management wrappers if the db lib doesn't expose it easily.
    // But `db.query` gets a client from pool.
    
    // Let's loop through the JSON structure
    if (!kjvData.books || !Array.isArray(kjvData.books)) {
        throw new Error('Invalid JSON structure: missing books array');
    }

    console.log('Starting seed process...');

    for (const book of kjvData.books) {
        const bookName = book.name;
        // Handle name discrepancies if necessary (e.g. "Psalm" vs "Psalms")
        // The JSON has "Genesis", DB likely "Genesis".
        // Warning: JSON might have "Psalms" but DB "Psalm" or vice versa.
        // Let's try direct match first.
        let bookId = bookMap.get(bookName);
        
        if (!bookId) {
            console.warn(`Could not find ID for book: ${bookName}`);
            errors.push(`Missing book ID: ${bookName}`);
            continue;
        }

        for (const chapter of book.chapters) {
            const chapterNum = chapter.chapter; // integer
            
            for (const verse of chapter.verses) {
                 const verseNum = verse.verse; // integer
                 const taggedText = verse.text;
                 
                 // Update the verse in DB
                 // optimizing: Fire and forget? No, we want to know it finished.
                 // Await ensures we don't overwhelm the pool.
                 try {
                     await db.query(
                         `UPDATE "KJV_verses" 
                          SET text = $1 
                          WHERE book_id = $2 AND chapter = $3 AND verse = $4`,
                         [taggedText, bookId, chapterNum, verseNum]
                     );
                     updatedCount++;
                 } catch (err: any) {
                     console.error(`Failed to update ${bookName} ${chapterNum}:${verseNum}`, err);
                     errors.push(`${bookName} ${chapterNum}:${verseNum}: ${err.message}`);
                 }
            }
        }
        console.log(`Finished processing ${bookName}`);
    }

    return NextResponse.json({
        success: true,
        message: `Updated ${updatedCount} verses.`,
        errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}
