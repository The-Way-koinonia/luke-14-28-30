# The Way - Monorepo

A faith-centered social network and Bible study app with advanced biblical study tools, social media features, and church community administration.

## 📁 Monorepo Structure

```
the-way/
├── apps/
│   ├── web/              # Next.js web application
│   └── mobile/           # React Native mobile app
├── packages/
│   └── types/            # Shared TypeScript types
├── database/
│   ├── docker-compose.yml
│   ├── scripts/          # Database import scripts
│   └── seeds/            # SQL seed data
├── docs/                 # Documentation
└── package.json          # Monorepo root config
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 2. Start Database

```bash
# Start PostgreSQL in Docker
npm run db:up

# Verify database is running
npm run db:logs
```

### 3. Import Bible Data (First Time Only)

```bash
# Import KJV Bible verses
npm run db:import -- "/path/to/bible_databases/formats/csv/KJV.csv"
```

### 4. Start Development Server

```bash
# Start Next.js web app
npm run dev

# Or specifically:
npm run dev:web
```

The web app will be available at **http://localhost:3000**

## 📦 Workspaces

This monorepo uses **npm workspaces** to manage multiple packages.

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web app development server |
| `npm run dev:web` | Start web app (explicit) |
| `npm run dev:mobile` | Start mobile app (when available) |
| `npm run build` | Build all workspaces |
| `npm run build:web` | Build web app only |
| `npm run lint` | Lint all workspaces |
| `npm run db:up` | Start PostgreSQL database |
| `npm run db:down` | Stop PostgreSQL database |
| `npm run db:shell` | Open PostgreSQL shell |
| `npm run db:import` | Import Bible data |

### Working with Specific Workspaces

```bash
# Install a package in web app
npm install <package> --workspace=apps/web

# Run a script in web app
npm run <script> --workspace=apps/web

# Install a dev dependency in types package
npm install -D <package> --workspace=packages/types
```

## 🗄️ Database Management

### Docker Commands

```bash
# Start database
npm run db:up

# Stop database
npm run db:down

# View logs
npm run db:logs

# Access PostgreSQL shell
npm run db:shell
```

### Mobile Database (SQLite)
The mobile app uses a local SQLite database that ships with the app.
- Schema: `database/schema-sqlite-mobile.sql`
- Verification: `scripts/verify_schema_optimizations.sh`

### Inside PostgreSQL Shell

```sql
-- List all tables
\dt

-- View table structure
\d bible_verses

-- Count records
SELECT COUNT(*) FROM bible_books;
SELECT COUNT(*) FROM bible_verses;

-- Exit
\q
```

## 🏗️ Project Structure

### Web App (`apps/web/`)

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── page.tsx      # Home page
│   │   └── layout.tsx    # Root layout
│   ├── lib/              # Utilities
│   │   ├── db/           # Database layer
│   │   │   ├── index.ts  # Connection pool
│   │   │   ├── repositories/  # Data access
│   │   │   └── services/      # Business logic
│   │   └── auth.ts       # NextAuth config
│   └── components/       # React components
├── public/               # Static files
├── .env.local           # Environment variables
└── package.json         # Web app dependencies
```

### Shared Types (`packages/types/`)

Contains TypeScript types shared between web and mobile apps:
- Bible types (BibleBook, BibleVerse, StrongsDefinition)
- User types (User, UserProfile)
- Social types (Post, Comment, VerseReference)
- Church types (Church, ChurchGroup, PrayerRequest)
- Study types (Highlight, Bookmark, ReadingPlan)

Import in any workspace:
```typescript
import { BibleVerse, User, Post } from '@the-way/types';
```

## 🔧 Environment Variables

### Web App (`apps/web/.env.local`)

```env
# Database
DATABASE_URL="postgresql://the_way_user:the_way_password@localhost:5432/the_way"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## 📚 Tech Stack

### Web (Next.js)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.9+
- **Database:** PostgreSQL 17
- **ORM:** Raw SQL with pg driver
- **Auth:** NextAuth.js
- **Styling:** Tailwind CSS

### Mobile (React Native)
- **Framework:** Expo SDK 52+
- **Database:** SQLite (Offline-first architecture)
  - Full-Text Search (FTS5) for instant Bible study
  - "Last Write Wins" conflict resolution for multi-device sync
  - Normalized tagging and flexible highlighting system
- **Navigation:** Expo Router
- **State:** Zustand + React Query

## 🎯 Development Workflow

### Adding a New Feature

1. **Create types** in `packages/types/src/`
2. **Create API route** in `apps/web/src/app/api/`
3. **Create repository** in `apps/web/src/lib/db/repositories/`
4. **Create service** in `apps/web/src/lib/db/services/`
5. **Create UI component** in `apps/web/src/components/`

### Database Changes

1. Update schema in `database/schema-postgresql.sql`
2. Create migration SQL file
3. Run migration manually (we'll add automated migrations later)

## 🐛 Troubleshooting

### Database Won't Start

```bash
# Check if port 5432 is already in use
lsof -i :5432

# Remove and restart
npm run db:down
docker volume rm the-way_postgres_data
npm run db:up
```

### Import Paths Not Resolving

```bash
# Reinstall dependencies
npm run clean
npm install
```

### TypeScript Errors

```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Rebuild
npm run build:web
```

## 📖 Documentation

- [Project Structure](./PROJECT_STRUCTURE.md) - Detailed breakdown of the monorepo
- [Database Migration Guide](./MIGRATION_GUIDE.md) - How to manage database changes
- [Mobile Development](./docs/MOBILE.md) (coming soon)

## 🗺️ Roadmap

- [x] Database schema and setup
- [x] Bible data import
- [x] Next.js web app initialization
- [x] Monorepo structure
- [ ] Authentication (NextAuth)
- [x] Bible reading API (Schema ready)
- [ ] Social feed API
- [/] React Native mobile app (Active Development)
- [x] Offline Bible reading (Schema & Sync Logic)
- [ ] Church administration features

## 📄 License

[Your License Here]

## 🙏 Contact

[Your Contact Information Here]

---

**Built with ❤️ for faith-centered communities**
