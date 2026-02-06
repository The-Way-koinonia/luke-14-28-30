import { NextRequest, NextResponse } from 'next/server';
import { pool } from "/Users/colinmontes/The Way/The Way/apps/web/src/lib/db/index";

// Helper for sorting keys and mapping to frontend expected format
const sortedDefinition = (def: any) => ({
    strongsId: def.strongs_number,
    strongs_number: def.strongs_number,
    original_word: def.original_word,
    lemma: def.original_word, // Frontend expects lemma
    xlit: def.transliteration, // Frontend expects xlit
    pron: def.pronunciation, // Frontend expects pron
    strongs_def: def.definition, // Frontend expects strongs_def
    derivation: def.derivation,
    kjv_def: def.kjv_usage, // Frontend expects kjv_def
    testament: def.testament
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const book = searchParams.get('book');
    const chapter = parseInt(searchParams.get('chapter') || '0');
    const verse = parseInt(searchParams.get('verse') || '0');
    const word = searchParams.get('word');
    const strongsIdParam = searchParams.get('strongsId');

    if (!strongsIdParam && (!book || !chapter || !verse || !word)) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (strongsIdParam) {
       // Normalize ID: H0430 -> H430 to match DB
       const normalizedId = strongsIdParam.replace(/^([GH])0+/, '$1');
       
       // Direct lookup by ID
       const defResult = await pool.query(
        `SELECT * FROM strongs_definitions WHERE strongs_number = $1`,
        [normalizedId]
      );

      if (defResult.rows.length === 0) {
           // Try original just in case
           const retryResult = await pool.query(
            `SELECT * FROM strongs_definitions WHERE strongs_number = $1`,
            [strongsIdParam] 
           );
           
           if (retryResult.rows.length > 0) {
             return NextResponse.json({
                success: true,
                data: sortedDefinition(retryResult.rows[0])
              });
           }

           return NextResponse.json({ 
              success: false, 
              error: 'Definition not found in database',
           }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: sortedDefinition(defResult.rows[0])
      });
    }

    // 1. Fetch verse text from Database
    const verseResult = await pool.query(
      `SELECT bv.text 
       FROM bible_verses bv
       JOIN bible_books bb ON bv.book_id = bb.id
       WHERE bb.name = $1 AND bv.chapter = $2 AND bv.verse = $3
       LIMIT 1`,
      [book, chapter, verse]
    );

    if (verseResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: `Verse not found: ${book} ${chapter}:${verse}` }, { status: 404 });
    }

    const verseText = verseResult.rows[0].text;

    // 2. Parse text to find Strong's ID for the word
    // Regex to match <w> tags and extract content
    // Example: <w lemma="strong:G3588 strong:G5330 ..." ...>the Pharisees</w>
    const wTagRegex = /<w\s+([^>]+)>([^<]+)<\/w>/g;
    let match;
    let strongsId = null;

    // Clean input word (remove punctuation)
    const cleanWord = (word || '').replace(/[.,;!?]/g, '').toLowerCase();

    while ((match = wTagRegex.exec(verseText)) !== null) {
        const [_, attributes, text] = match;
        
        // Check if the word inside the tag matches our target word
        if (text.toLowerCase().includes(cleanWord)) {
            // Extract strongs IDs from attributes
            // lemma="strong:G3588 strong:G5330 ..."
            const ids = [];
            const idRegex = /strong:([GH]\d+)/g;
            let idMatch;
            while ((idMatch = idRegex.exec(attributes)) !== null) {
                ids.push(idMatch[1]);
            }
            
            if (ids.length > 0) {
                // If multiple IDs, we prefer the one that isn't an article if possible, 
                // but simpler heuristic: take the last one? 
                // G3588 is "the". G5330 is "Pharisees". Order is usually "Article Noun".
                // So taking the last ID is often the substantive word.
                strongsId = ids[ids.length - 1]; 
                break;
            }
        }
    }

    if (!strongsId) {
        return NextResponse.json({ success: false, error: 'Strong\'s number not found for word' }, { status: 404 });
    }

    // Normalize ID: H0430 -> H430 
    // The DB likely stores "H430" or "G25" (without leading zeros for H/G usually, or maybe with?)
    // Let's check schema/data convention. Common convention varies.
    // The previous code did: strongsId = strongsId.replace(/^([GH])0+/, '$1');
    // We will keep this normalization to match likely DB keys.
    const normalizedStrongsId = strongsId.replace(/^([GH])0+/, '$1');

    // 3. Fetch Definition from Database
    const defResult = await pool.query(
      `SELECT * FROM strongs_definitions WHERE strongs_number = $1`,
      [normalizedStrongsId]
    );

    if (defResult.rows.length === 0) {
         return NextResponse.json({ 
            success: false, 
            error: 'Definition not found in database',
            debug: {
                rawId: strongsId,
                normalizedId: normalizedStrongsId
            }
         }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        strongsId: normalizedStrongsId,
        ...defResult.rows[0]
      }
    });

  } catch (error: any) {
    console.error('Error fetching Strong\'s data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Force rebuild check
