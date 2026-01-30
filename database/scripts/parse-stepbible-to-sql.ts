#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

const BOOK_MAP: Record<string, number> = {
  'Gen': 1, 'Exo': 2, 'Lev': 3, 'Num': 4, 'Deu': 5, 'Jos': 6, 'Jdg': 7, 'Rut': 8, '1Sa': 9, '2Sa': 10,
  '1Ki': 11, '2Ki': 12, '1Ch': 13, '2Ch': 14, 'Ezr': 15, 'Neh': 16, 'Est': 17, 'Job': 18, 'Psa': 19, 'Pro': 20,
  'Ecc': 21, 'Sng': 22, 'Isa': 23, 'Jer': 24, 'Lam': 25, 'Ezk': 26, 'Dan': 27, 'Hos': 28, 'Jol': 29, 'Amo': 30,
  'Oba': 31, 'Jon': 32, 'Mic': 33, 'Nam': 34, 'Hab': 35, 'Zep': 36, 'Hag': 37, 'Zec': 38, 'Mal': 39,
  'Mat': 40, 'Mrk': 41, 'Luk': 42, 'Jhn': 43, 'Act': 44, 'Rom': 45, '1Co': 46, '2Co': 47, 'Gal': 48, 'Eph': 49,
  'Php': 50, 'Col': 51, '1Th': 52, '2Th': 53, '1Ti': 54, '2Ti': 55, 'Tit': 56, 'Phm': 57, 'Heb': 58, 'Jas': 59,
  '1Pe': 60, '2Pe': 61, '1Jn': 62, '2Jn': 63, '3Jn': 64, 'Jud': 65, 'Rev': 66
};

interface VerseData { bookId: number; chapter: number; verse: number; words: Array<{position: number; strongsNumbers: string[]}>; }

function parseTTESVLine(line: string): VerseData | null {
  if (!line.startsWith('$')) return null;
  line = line.substring(1);
  const parts = line.split(/\t+/).map(p => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const refMatch = parts[0].match(/^([A-Za-z0-9]+)\s+(\d+):(\d+)$/);
  if (!refMatch) return null;
  const [, bookAbbr, chapterStr, verseStr] = refMatch;
  const bookId = BOOK_MAP[bookAbbr];
  if (!bookId) return null;
  const words: Array<{position: number; strongsNumbers: string[]}> = [];
  for (let i = 1; i < parts.length; i++) {
    const m = parts[i].match(/^(\d+(?:\+\d+)*)=<([^>]+)>$/);
    if (!m) continue;
    const pos = parseInt(m[1].split('+')[0], 10);
    const nums = m[2].split('+').map(s => (s.trim().startsWith('0') ? 'H' : 'G') + s.trim());
    words.push({ position: pos, strongsNumbers: nums });
  }
  return { bookId, chapter: parseInt(chapterStr), verse: parseInt(verseStr), words };
}

function generateSQL(data: VerseData[], out: string): void {
  const sql = ['-- Auto-generated from STEPBible TTESV', '', 'BEGIN;', ''];
  let n = 0;
  for (const v of data) {
    for (const w of v.words) {
      for (const s of w.strongsNumbers) {
        sql.push(`INSERT INTO verse_words (book_id, chapter, verse, word_position, word_text, strongs_number) VALUES (${v.bookId}, ${v.chapter}, ${v.verse}, ${w.position}, '', '${s}');`);
        if (++n % 1000 === 0) sql.push('COMMIT; BEGIN;');
      }
    }
  }
  sql.push('', 'COMMIT;', '', `-- Total: ${n}`);
  fs.writeFileSync(out, sql.join('\n'));
  console.log(`✅ Generated ${n} inserts -> ${out}`);
}

async function main() {
  const file = '/Users/colinmontes/The Way/data/stepbible/Tagged-Bibles/TTESV - Tyndale Translation tags for ESV - TyndaleHouse.com STEPBible.org CC BY-NC.txt';
  if (!fs.existsSync(file)) { console.error('❌ Not found:', file); process.exit(1); }
  console.log('📖 Reading...');
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  console.log('🔍 Parsing...');
  const data: VerseData[] = [];
  for (const line of lines) {
    const v = parseTTESVLine(line);
    if (v) { data.push(v); if (data.length % 1000 === 0) console.log(`   ${data.length}...`); }
  }
  console.log(`✅ Parsed ${data.length} verses`);
  const outDir = '/Users/colinmontes/The Way/The Way/data/sql';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'verse-words-from-ttesv.sql');
  generateSQL(data, outFile);
  console.log('\n🎉 Import: docker exec -i theway-postgres-1 psql -U the_way_user -d the_way < data/sql/verse-words-from-ttesv.sql');
}

main().catch(console.error);
