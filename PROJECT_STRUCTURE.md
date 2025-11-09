# THE WAY - Complete Monorepo Structure

## 📁 Directory Structure

```
the-way/
├── README.md
├── package.json                    # Root workspace config
├── .gitignore
├── .env.example
├── turbo.json                      # Turbo build config (optional)
│
├── apps/
│   ├── web/                        # Next.js Web App
│   │   ├── src/
│   │   │   ├── app/                # Next.js 15 App Router
│   │   │   │   ├── (auth)/         # Auth-required routes
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── profile/
│   │   │   │   │   └── feed/
│   │   │   │   ├── (public)/       # Public routes
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── about/
│   │   │   │   └── api/            # API Routes
│   │   │   │       ├── auth/       # NextAuth endpoints
│   │   │   │       │   └── [...nextauth]/
│   │   │   │       ├── social/     # Social features
│   │   │   │       │   ├── posts/
│   │   │   │       │   ├── comments/
│   │   │   │       │   └── likes/
│   │   │   │       ├── bible/      # Bible endpoints
│   │   │   │       │   ├── verses/
│   │   │   │       │   ├── search/
│   │   │   │       │   └── strongs/
│   │   │   │       └── church/     # Church Link endpoints
│   │   │   │           ├── groups/
│   │   │   │           ├── prayers/
│   │   │   │           └── sermons/
│   │   │   │
│   │   │   ├── lib/                # Shared utilities
│   │   │   │   ├── db/
│   │   │   │   │   ├── index.ts    # DB connection pool
│   │   │   │   │   ├── repositories/
│   │   │   │   │   │   ├── user.repository.ts
│   │   │   │   │   │   ├── post.repository.ts
│   │   │   │   │   │   ├── bible.repository.ts
│   │   │   │   │   │   └── church.repository.ts
│   │   │   │   │   └── migrations/
│   │   │   │   │       └── 001_initial.sql
│   │   │   │   │
│   │   │   │   ├── services/       # Business logic
│   │   │   │   │   ├── social.service.ts
│   │   │   │   │   ├── bible.service.ts
│   │   │   │   │   └── church.service.ts
│   │   │   │   │
│   │   │   │   ├── auth.ts         # NextAuth config
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   └── components/         # React components
│   │   │       ├── bible/
│   │   │       ├── social/
│   │   │       └── ui/
│   │   │
│   │   ├── public/
│   │   ├── .env.local
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── mobile/                     # React Native (Expo)
│       ├── app/                    # Expo Router
│       │   ├── (tabs)/             # Bottom tab navigator
│       │   │   ├── index.tsx       # Bible reading
│       │   │   ├── feed.tsx        # Social feed
│       │   │   ├── church.tsx      # Church Link
│       │   │   └── profile.tsx
│       │   ├── (auth)/
│       │   │   ├── sign-in.tsx
│       │   │   └── sign-up.tsx
│       │   └── _layout.tsx
│       │
│       ├── src/
│       │   ├── api/                # API client
│       │   │   ├── client.ts       # Axios/Fetch wrapper
│       │   │   ├── social.api.ts
│       │   │   ├── church.api.ts
│       │   │   └── sync.api.ts     # Sync local data to server
│       │   │
│       │   ├── database/           # SQLite
│       │   │   ├── index.ts        # DB initialization
│       │   │   ├── bible.db.ts     # Bible queries
│       │   │   ├── strongs.db.ts   # Strong's queries
│       │   │   └── user.db.ts      # User data queries
│       │   │
│       │   ├── components/
│       │   │   ├── bible/
│       │   │   │   ├── VerseReader.tsx
│       │   │   │   ├── WordClickable.tsx  # The clickable word tool
│       │   │   │   └── StrongsModal.tsx
│       │   │   ├── social/
│       │   │   │   ├── PostCard.tsx
│       │   │   │   ├── CommentList.tsx
│       │   │   │   └── CreatePost.tsx
│       │   │   └── church/
│       │   │
│       │   ├── hooks/              # Custom React hooks
│       │   │   ├── useBibleVerse.ts
│       │   │   ├── useStrongsLookup.ts
│       │   │   ├── usePosts.ts
│       │   │   └── useSync.ts
│       │   │
│       │   ├── stores/             # State management (Zustand)
│       │   │   ├── auth.store.ts
│       │   │   ├── bible.store.ts
│       │   │   └── offline.store.ts
│       │   │
│       │   └── utils/
│       │       ├── sync.ts         # Background sync logic
│       │       └── helpers.ts
│       │
│       ├── assets/
│       │   └── bible.db            # Pre-built SQLite database (15-20MB)
│       │
│       ├── .env
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                       # Shared code
│   ├── types/                      # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── user.types.ts
│   │   │   ├── bible.types.ts
│   │   │   ├── post.types.ts
│   │   │   ├── church.types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-client/                 # Shared API client (optional)
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/                     # Shared configs
│       ├── eslint-config/
│       └── typescript-config/
│
├── database/                       # Database files & scripts
│   ├── schema-postgresql.sql       # ✅ Already created
│   ├── schema-sqlite-mobile.sql    # ✅ Already created
│   ├── seeds/
│   │   ├── bible_verses.sql        # From scrollmapper
│   │   ├── strongs.sql             # From scrollmapper
│   │   └── cross_references.sql    # From scrollmapper
│   └── scripts/
│       ├── import-scrollmapper.ts  # Script to import Bible data
│       └── build-mobile-db.ts      # Script to create SQLite for mobile
│
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    └── MOBILE_SYNC.md
```

---

## 🔧 Root package.json (Workspace Config)

```json
{
  "name": "the-way-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "cd apps/web && npm run dev",
    "dev:mobile": "cd apps/mobile && npm run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "clean": "turbo run clean",
    "db:migrate": "cd apps/web && npm run db:migrate",
    "db:seed": "cd database/scripts && ts-node import-scrollmapper.ts"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.9.3"
  }
}
```

---

## 📦 Technology Stack Summary

### Web (Next.js)
- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL (via `pg` package)
- **Auth:** NextAuth.js
- **State:** React Query (TanStack Query)
- **Styling:** Tailwind CSS

### Mobile (React Native)
- **Framework:** Expo (SDK 52+)
- **Database:** SQLite (`expo-sqlite`)
- **Navigation:** Expo Router (file-based)
- **State:** Zustand + React Query
- **Styling:** NativeWind (Tailwind for RN)

### Shared
- **Language:** TypeScript 5.9+
- **Package Manager:** npm (or pnpm for speed)
- **Monorepo:** npm workspaces (or Turb

o)

---

## 🔄 Data Flow Architecture

### Bible Reading (Offline)
```
Mobile App
    ↓
Local SQLite (instant)
    ↓
Display verse + clickable words
    ↓
User taps word
    ↓
SQLite lookup (10-30ms)
    ↓
Show Strong's definition
```

### Social Features (Online)
```
Mobile App
    ↓
API Call (/api/social/posts)
    ↓
Next.js API Route
    ↓
Service Layer (business logic)
    ↓
Repository Layer (SQL queries)
    ↓
PostgreSQL
    ↓
Return JSON to mobile
    ↓
Display in feed
```

### User Study Data (Hybrid)
```
Mobile App
    ↓
Save highlight to SQLite (instant)
    ↓
Background sync service
    ↓
API Call (/api/bible/highlights)
    ↓
Save to PostgreSQL
    ↓
Mark as synced in SQLite
```

---

## 🎯 Key Features & Their Implementation

| Feature | Mobile | Web | Database |
|---------|--------|-----|----------|
| **Bible Reading** | SQLite (offline) | PostgreSQL (API) | Both |
| **Clickable Word Tool** | SQLite (instant) | PostgreSQL | Both |
| **Social Feed** | API calls | Next.js API | PostgreSQL only |
| **Church Groups** | API calls | Next.js API | PostgreSQL only |
| **Highlights** | SQLite + Sync | PostgreSQL | Both |
| **Memory Verses** | SQLite + Sync | PostgreSQL | Both |
| **Search Bible** | SQLite FTS | PostgreSQL FTS | Both |

---

## 📱 Mobile App Size Estimate

```
Base React Native app:       ~30 MB
Embedded SQLite database:    ~20 MB (compressed)
    - Bible verses:          ~4.5 MB
    - Strong's definitions:  ~1.5 MB
    - Cross-references:      ~2 MB
    - Word mappings:         ~8 MB
    - Indexes:               ~4 MB
Total estimated app size:    ~50 MB
```

This is acceptable for modern apps (Instagram is 250MB+).

---

## 🚀 Next Steps to Build

1. **Set up monorepo** (create root structure)
2. **Initialize Next.js** (web app)
3. **Initialize Expo** (mobile app)
4. **Create shared types** package
5. **Set up PostgreSQL** locally (Docker)
6. **Import scrollmapper data** (Bible verses, Strong's)
7. **Build SQLite database** for mobile
8. **Implement NextAuth** (authentication)
9. **Create first API endpoint** (GET /api/social/posts)
10. **Build first mobile screen** (Bible reader)

---

## 💡 Benefits of This Architecture

✅ **Clean separation**: Bible = offline, Social = online
✅ **Fast Bible reading**: No network lag
✅ **Standard patterns**: Like Instagram/Twitter
✅ **Easy to test**: Can test mobile Bible offline
✅ **Scalable**: Add features without breaking existing code
✅ **Code sharing**: Types shared between web/mobile
✅ **Developer experience**: Clear boundaries

---

Ready to start building? This is your foundation! 🎉
