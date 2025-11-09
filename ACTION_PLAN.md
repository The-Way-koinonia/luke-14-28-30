
# THE WAY - Next Steps Action Plan

## 🎯 Your Complete Architecture is Ready!

You now have:
- ✅ **PostgreSQL schema** (40+ tables for web backend)
- ✅ **SQLite schema** (Bible study tools for mobile)
- ✅ **Monorepo structure** (organized codebase)
- ✅ **Clear architecture** (separation of concerns)
- ✅ **Data sources** (scrollmapper Bible data)

---

## 📅 WEEK 1: Foundation Setup

### Day 1-2: Project Initialization

**1. Download Bible Data (30 minutes)**
```bash
# You'll need to do this manually since git clone was blocked
# Go to: https://github.com/scrollmapper/bible_databases
# Download ZIP of the repository
# Extract to your local machine

# You need these specific files:
# - KJV Bible text (from /formats/sql/ or /formats/sqlite/)
# - Strong's concordance data
# - Cross-references data
```

**2. Create Monorepo (1 hour)**
```bash
# Create root directory
mkdir the-way
cd the-way

# Initialize root package.json
npm init -y

# Set up workspace
# Edit package.json and add:
{
  "workspaces": ["apps/*", "packages/*"]
}

# Create directory structure
mkdir -p apps/web apps/mobile packages/types database/seeds
```

**3. Initialize Next.js Web App (30 minutes)**
```bash
cd apps
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir
cd web

# Install dependencies
npm install pg dotenv
npm install --save-dev @types/pg

# Copy schema-postgresql.sql to apps/web/database/
```

**4. Set Up PostgreSQL Locally (1 hour)**

**Option A: Docker (Recommended)**
```bash
# Create docker-compose.yml in root
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: the_way
      POSTGRES_USER: the_way_user
      POSTGRES_PASSWORD: your_password_here
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:

# Start database
docker-compose up -d
```

**Option B: Local Install**
- macOS: `brew install postgresql@16`
- Windows: Download from postgresql.org
- Linux: `sudo apt install postgresql-16`

**5. Create .env.local (5 minutes)**
```bash
# In apps/web/.env.local
DATABASE_URL="postgresql://the_way_user:your_password_here@localhost:5432/the_way"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-key-here"
```

---

### Day 3-4: Database Setup

**1. Run PostgreSQL Schema (30 minutes)**
```bash
# Connect to PostgreSQL
psql -U the_way_user -d the_way

# Or with Docker
docker exec -it the-way-postgres-1 psql -U the_way_user -d the_way

# Run schema
\i /path/to/schema-postgresql.sql

# Verify tables created
\dt

# Should see 40+ tables
```

**2. Import scrollmapper Bible Data (2-3 hours)**

You'll need to write a script to import from scrollmapper to your PostgreSQL. Here's a starter:

```typescript
// database/scripts/import-bible-data.ts
import { Pool } from 'pg';
import * as fs from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function importBibleVerses() {
  // Read scrollmapper KJV data
  // Parse and insert into bible_verses table
  
  const data = JSON.parse(
    fs.readFileSync('path/to/scrollmapper/KJV.json', 'utf8')
  );
  
  for (const verse of data) {
    await pool.query(
      `INSERT INTO bible_verses (translation, book_id, chapter, verse, text)
       VALUES ($1, $2, $3, $4, $5)`,
      ['KJV', verse.book, verse.chapter, verse.verse, verse.text]
    );
  }
  
  console.log('Bible verses imported!');
}

importBibleVerses();
```

**3. Verify Data (15 minutes)**
```sql
-- Check verses imported
SELECT COUNT(*) FROM bible_verses;  -- Should be ~31,102

-- Check Strong's imported
SELECT COUNT(*) FROM strongs_definitions;  -- Should be ~14,298

-- Test query
SELECT text FROM bible_verses 
WHERE book_id = 43 AND chapter = 3 AND verse = 16;
-- Should return John 3:16
```

---

### Day 5-7: Basic Web API

**1. Set Up Proper Architecture (2 hours)**

```typescript
// apps/web/src/lib/db/index.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = {
  async query<T>(text: string, params?: any[]): Promise<T[]> {
    const result = await pool.query(text, params);
    return result.rows;
  }
};
```

```typescript
// apps/web/src/lib/db/repositories/bible.repository.ts
import { db } from '../index';
import type { BibleVerse } from '@/types';

export const bibleRepository = {
  async getVerse(book: number, chapter: number, verse: number): Promise<BibleVerse | null> {
    const [row] = await db.query<BibleVerse>(
      `SELECT * FROM bible_verses 
       WHERE book_id = $1 AND chapter = $2 AND verse = $3`,
      [book, chapter, verse]
    );
    return row || null;
  },

  async getChapter(book: number, chapter: number): Promise<BibleVerse[]> {
    return db.query<BibleVerse>(
      `SELECT * FROM bible_verses 
       WHERE book_id = $1 AND chapter = $2
       ORDER BY verse`,
      [book, chapter]
    );
  }
};
```

**2. Create First API Endpoint (30 minutes)**

```typescript
// apps/web/src/app/api/bible/verses/route.ts
import { NextResponse } from 'next/server';
import { bibleRepository } from '@/lib/db/repositories/bible.repository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const book = parseInt(searchParams.get('book') || '1');
  const chapter = parseInt(searchParams.get('chapter') || '1');

  try {
    const verses = await bibleRepository.getChapter(book, chapter);
    return NextResponse.json({ verses });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch verses' },
      { status: 500 }
    );
  }
}
```

**3. Test API (15 minutes)**
```bash
# Start dev server
cd apps/web
npm run dev

# Test in browser or curl
curl http://localhost:3000/api/bible/verses?book=43&chapter=3

# Should return John chapter 3
```

---

## 📅 WEEK 2: Mobile App Foundation

### Day 8-9: Initialize React Native

**1. Create Expo App (30 minutes)**
```bash
cd apps
npx create-expo-app mobile --template blank-typescript
cd mobile

# Install dependencies
npx expo install expo-router expo-sqlite react-native-gesture-handler
npm install @tanstack/react-query zustand axios
```

**2. Set Up Expo Router (1 hour)**
```bash
# Follow structure from PROJECT_STRUCTURE.md
mkdir -p app/(tabs) app/(auth) src/database src/components src/api
```

**3. Create SQLite Database (2-3 hours)**

This is the CRITICAL step - you need to create the pre-built SQLite database.

```typescript
// database/scripts/build-mobile-db.ts
import Database from 'better-sqlite3';
import * as fs from 'fs';

// Read schema
const schema = fs.readFileSync('schema-sqlite-mobile.sql', 'utf8');

// Create database
const db = new Database('bible.db');
db.exec(schema);

// Import KJV verses from scrollmapper
const kjvData = JSON.parse(fs.readFileSync('scrollmapper/KJV.json', 'utf8'));

const insert = db.prepare(`
  INSERT INTO bible_verses (translation, book_id, chapter, verse, text)
  VALUES (?, ?, ?, ?, ?)
`);

for (const verse of kjvData) {
  insert.run('KJV', verse.bookId, verse.chapter, verse.verse, verse.text);
}

console.log('Mobile database created: bible.db');
```

**4. Test SQLite Database (30 minutes)**
```typescript
// Test script
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('bible.db');

const verse = db.getFirstSync(
  'SELECT * FROM bible_verses WHERE book_id = ? AND chapter = ? AND verse = ?',
  [43, 3, 16]
);

console.log(verse);  // Should show John 3:16
```

---

### Day 10-12: Mobile Bible Reader

**1. Create Bible Reader Component (3 hours)**

```typescript
// apps/mobile/src/components/bible/VerseReader.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useBibleVerse } from '@/hooks/useBibleVerse';

export function VerseReader({ book, chapter }: Props) {
  const { verses, loading } = useBibleVerse(book, chapter);

  return (
    <View>
      {verses.map(verse => (
        <View key={verse.id}>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>{verse.verse}</Text>
            {' '}
            <Text>{verse.text}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}
```

**2. Implement Clickable Words (4 hours)**

This is YOUR KEY FEATURE. Make it work well!

```typescript
// apps/mobile/src/components/bible/WordClickable.tsx
import { Text, TouchableOpacity } from 'react-native';
import { useStrongsLookup } from '@/hooks/useStrongsLookup';

export function WordClickable({ word, book, chapter, verse, position }: Props) {
  const { showModal } = useStrongsLookup();

  const handlePress = async () => {
    const strongsData = await getStrongsForWord(book, chapter, verse, position);
    showModal(strongsData);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text style={{ color: 'blue', textDecorationLine: 'underline' }}>
        {word}
      </Text>
    </TouchableOpacity>
  );
}
```

**3. Test on Real Device (1 hour)**
```bash
# Install Expo Go on your phone
# Run dev server
npx expo start

# Scan QR code
# Test Bible reading offline (turn off WiFi!)
```

---

### Day 13-14: Authentication + First Social Feature

**1. Set Up NextAuth (2 hours)**

```typescript
// apps/web/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { userRepository } from '@/lib/db/repositories/user.repository';

export const authOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' }
      },
      async authorize(credentials) {
        // Implement login logic
        const user = await userRepository.findByEmail(credentials.email);
        if (user && verifyPassword(credentials.password, user.hashedPassword)) {
          return { id: user.id, email: user.email };
        }
        return null;
      }
    })
  ]
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**2. Create Social Feed API (2 hours)**

```typescript
// apps/web/src/app/api/social/posts/route.ts
export async function GET() {
  const posts = await postRepository.findLatest(50);
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content, bibleReference } = await request.json();
  const post = await postRepository.create({
    authorId: session.user.id,
    content,
    bibleReference
  });

  return NextResponse.json({ post }, { status: 201 });
}
```

**3. Connect Mobile to API (1 hour)**

```typescript
// apps/mobile/src/api/social.api.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';  // Update for production

export const socialApi = {
  async getPosts() {
    const { data } = await axios.get(`${API_URL}/social/posts`);
    return data.posts;
  },

  async createPost(content: string, bibleReference?: string) {
    const { data } = await axios.post(`${API_URL}/social/posts`, {
      content,
      bibleReference
    });
    return data.post;
  }
};
```

---

## ✅ End of Week 2 Checkpoint

By the end of Week 2, you should have:

✅ **Working web API**
- Bible verses endpoint working
- Social posts endpoint working
- Authentication working

✅ **Working mobile app**
- Bible reader displaying verses
- Clickable words showing Strong's definitions
- Can create posts

✅ **Data pipeline**
- PostgreSQL with Bible data
- SQLite database built for mobile
- Sync between mobile and API working

---

## 🚀 NEXT PHASES (Weeks 3-24)

### Phase 2 (Weeks 3-6): Core Features
- Complete social feed (comments, likes)
- User profiles
- Bible search
- Memory verses
- Reading plans

### Phase 3 (Weeks 7-12): Church Link
- Church groups
- Prayer lists
- Sermons
- Pastor admin tools

### Phase 4 (Weeks 13-18): Advanced Bible Tools
- Refine clickable word tool
- Cross-references UI
- Topical lookups
- Daily devotions

### Phase 5 (Weeks 19-24): Polish & Testing
- UI/UX refinement
- Performance optimization
- Alpha testing with 100 users
- Bug fixes

---

## 📊 Success Metrics for 6-Month Timeline

**Month 1:** ✅ Foundation complete (infrastructure, auth, basic Bible reading)
**Month 2:** ✅ Social features working (posts, comments, likes)
**Month 3:** ✅ Church Link MVP (groups, prayers)
**Month 4:** ✅ Advanced Bible tools (clickable words fully working)
**Month 5:** ✅ Polish + Internal testing
**Month 6:** ✅ Alpha release to 100 users

---

## 💡 Tips for Success

1. **Start small:** Get ONE feature working end-to-end before moving to the next
2. **Test frequently:** Test Bible reading offline every day
3. **Focus on UX:** The clickable word tool must feel instant (<100ms)
4. **Ask for help:** Come back with specific questions when stuck
5. **Document:** Keep notes on what works and what doesn't

---

## 🆘 Common Issues & Solutions

### "Bible data import is taking forever"
- Solution: Use bulk inserts, not individual inserts
- Process 1000 rows at a time in transactions

### "Mobile app is slow"
- Solution: Check SQLite indexes are created
- Profile with React Native performance tools

### "Can't test mobile API calls"
- Solution: Use `ngrok` to expose localhost to mobile device
- Or use Expo's tunnel feature

---

## 📞 Ready to Start?

You have everything you need. The architecture is solid. The data sources are identified. The path is clear.

**Your first task:**
1. Download scrollmapper Bible database
2. Set up PostgreSQL locally
3. Run schema-postgresql.sql
4. Import Bible verses
5. Test: `SELECT * FROM bible_verses WHERE book_id = 43 AND chapter = 3;`

When that works, you'll have proven the foundation is solid. Then build forward one step at a time.

**Good luck! You've got this! 🚀**
