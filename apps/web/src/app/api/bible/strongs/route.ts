import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Cache the data in memory to avoid reading files on every request
// In a serverless environment, this might be re-initialized, but acceptable for this scale.
let kjvData: any | null = null;
let hebrewDictionary: Record<string, any> | null = null;
let greekDictionary: Record<string, any> | null = null;

async function loadData() {
  console.log('Current working directory:', process.cwd());
  
  if (!kjvData) {
    // Assuming CWD is apps/web
    const dataPath = path.join(process.cwd(), 'src/data/KJV_test.json');
    console.log('Loading KJV data from:', dataPath);
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    kjvData = JSON.parse(fileContent);
  }

  if (!hebrewDictionary) {
    const dictPath = path.join(process.cwd(), '../../strongs/hebrew/strongs-hebrew-dictionary.js');
    console.log('Loading Hebrew dictionary from:', dictPath);
    try {
        const fileContent = await fs.readFile(dictPath, 'utf-8');
        // Robustly extract JSON object by finding outer braces
        const startIndex = fileContent.indexOf('{');
        const endIndex = fileContent.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            const jsonStr = fileContent.substring(startIndex, endIndex + 1);
            hebrewDictionary = JSON.parse(jsonStr);
        } else {
            console.error('Could not find JSON object in Hebrew dictionary');
            hebrewDictionary = {};
        }
    } catch (e) {
        console.error("Failed to load Hebrew dictionary", e);
        hebrewDictionary = {};
    }
  }

  if (!greekDictionary) {
    const dictPath = path.join(process.cwd(), '../../strongs/greek/strongs-greek-dictionary.js');
    console.log('Loading Greek dictionary from:', dictPath);
    try {
        const fileContent = await fs.readFile(dictPath, 'utf-8');
        const startIndex = fileContent.indexOf('{');
        const endIndex = fileContent.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            const jsonStr = fileContent.substring(startIndex, endIndex + 1);
            greekDictionary = JSON.parse(jsonStr);
        } else {
            console.error('Could not find JSON object in Greek dictionary');
            greekDictionary = {};
        }
    } catch (e) {
        console.error("Failed to load Greek dictionary", e);
        greekDictionary = {};
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const book = searchParams.get('book');
    const chapter = parseInt(searchParams.get('chapter') || '0');
    const verse = parseInt(searchParams.get('verse') || '0');
    const word = searchParams.get('word');

    if (!book || !chapter || !verse || !word) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    await loadData();

    // Traverse the structured JSON
    const bookData = kjvData?.books?.find((b: any) => b.name.toLowerCase() === book.toLowerCase());
    
    if (!bookData) {
        return NextResponse.json({ success: false, error: `Book '${book}' not found` }, { status: 404 });
    }

    const chapterData = bookData.chapters.find((c: any) => c.chapter === chapter);

    if (!chapterData) {
        return NextResponse.json({ success: false, error: `Chapter ${chapter} not found in ${book}` }, { status: 404 });
    }

    const targetVerse = chapterData.verses.find((v: any) => v.verse === verse);

    if (!targetVerse) {
        return NextResponse.json({ success: false, error: `Verse ${verse} not found in ${book} ${chapter}` }, { status: 404 });
    }

    // Regex to match <w> tags and extract content
    // Example: <w lemma="strong:G3588 strong:G5330 ..." ...>the Pharisees</w>
    const wTagRegex = /<w\s+([^>]+)>([^<]+)<\/w>/g;
    let match;
    let strongsId = null;

    // Clean input word (remove punctuation)
    const cleanWord = word.replace(/[.,;!?]/g, '').toLowerCase();

    while ((match = wTagRegex.exec(targetVerse.text)) !== null) {
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
                
                // Debug log
                // console.log(`Matched '${cleanWord}' in '${text}'. IDs: ${ids.join(', ')} -> Selected: ${strongsId}`);
                break;
            }
        }
    }

    if (!strongsId) {
        return NextResponse.json({ success: false, error: 'Strong\'s number not found for word' }, { status: 404 });
    }

    // Customize debug logging
    // console.log(`Found Strong's ID for '${cleanWord}': ${strongsId}`);

    // Normalize ID: H0430 -> H430
    const rawId = strongsId;
    strongsId = strongsId.replace(/^([GH])0+/, '$1');
    // console.log(`Normalized ID: ${rawId} -> ${strongsId}`);

    // Look up definition
    let definition = null;
    if (strongsId.startsWith('H')) {
        // console.log(`Looking up ${strongsId} in Hebrew dictionary. Loaded? ${!!hebrewDictionary}`);
        if (hebrewDictionary) definition = hebrewDictionary[strongsId];
    } else if (strongsId.startsWith('G')) {
        if (greekDictionary) definition = greekDictionary[strongsId];
    }

    if (!definition) {
         // Return debug info in error
         return NextResponse.json({ 
            success: false, 
            error: 'Definition not found',
            debug: {
                rawId,
                normalizedId: strongsId,
                foundInHebrew: hebrewDictionary ? !!hebrewDictionary[strongsId] : false,
                foundInGreek: greekDictionary ? !!greekDictionary[strongsId] : false,
                hebrewDictKeys: hebrewDictionary ? Object.keys(hebrewDictionary).slice(0, 5) : []
            }
         }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        strongsId,
        ...definition
      }
    });

  } catch (error: any) {
    console.error('Error fetching Strong\'s data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack,
        cwd: process.cwd()
      },
      { status: 500 }
    );
  }
}
