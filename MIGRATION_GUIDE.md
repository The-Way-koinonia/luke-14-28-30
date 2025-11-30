# 🚀 Monorepo Migration Guide

This guide will help you restructure your current "The Way" project into the planned monorepo structure.

## ⚠️ Before You Start

1. **Commit your current work** to git (or create a backup)
2. **Close VS Code** and any running servers
3. **Stop the database**: `docker compose down`

## 📋 Migration Steps

### Step 1: Backup Your Current Setup

```bash
cd "/Users/colinmontes/The Way"

# Create a backup
cp -r . ../the-way-backup

# Or commit to git
git add .
git commit -m "Backup before monorepo restructure"
```

### Step 2: Download Migration Files

Download these files from Claude and save them to your project root:

1. `restructure-monorepo.sh` - Automated migration script
2. `package.json` - Root workspace config
3. `apps-web-package.json` - Web app package.json (save as temp file)
4. `packages-types-package.json` - Types package.json (save as temp file)
5. `packages-types-index.ts` - Shared types (save as temp file)
6. `README-monorepo.md` - New README (save as temp file)

### Step 3: Run the Migration Script

```bash
cd "/Users/colinmontes/The Way"

# Make script executable
chmod +x restructure-monorepo.sh

# Run migration
./restructure-monorepo.sh
```

The script will:
- ✅ Create `apps/web/`, `packages/types/`, `database/` directories
- ✅ Move your Next.js app to `apps/web/src/`
- ✅ Move database files to `database/`
- ✅ Keep `.git/`, `.gitignore` at root
- ✅ Preserve all your existing code

### Step 4: Set Up Package Files

```bash
# Copy root package.json
cp package.json package.json.old  # Backup current
mv package.json package.json      # Use new one from Claude

# Set up web app package.json
mv apps-web-package.json apps/web/package.json

# Set up types package.json
mv packages-types-package.json packages/types/package.json

# Set up shared types
mkdir -p packages/types/src
mv packages-types-index.ts packages/types/src/index.ts

# Update README
mv README.md README-old.md        # Backup
mv README-monorepo.md README.md
```

### Step 5: Install Dependencies

```bash
# Install root workspace dependencies
npm install

# Install web app dependencies
cd apps/web
npm install
cd ../..
```

### Step 6: Update Import Paths

The migration script moves files, but you'll need to update import paths:

**Before (old structure):**
```typescript
import { pool } from '@/lib/db';
```

**After (monorepo structure):**
```typescript
// Still works! Next.js @ alias points to apps/web/src/
import { pool } from '@/lib/db';
```

The `@/` alias is configured in `apps/web/tsconfig.json` and should still work.

### Step 7: Update Database Connection

The `docker-compose.yml` is now in `database/` directory.

Update `apps/web/.env.local` if needed:
```env
DATABASE_URL="postgresql://the_way_user:the_way_password@localhost:5432/the_way"
```

### Step 8: Start Everything

```bash
# From project root

# 1. Start database
npm run db:up

# 2. Start web app
npm run dev

# Or from apps/web directory
cd apps/web
npm run dev
```

### Step 9: Verify Everything Works

1. **Open http://localhost:3000** - Should show your Next.js app
2. **Test API**: http://localhost:3000/api/test - Should show database connection
3. **Check database**:
   ```bash
   npm run db:shell
   # Then in PostgreSQL:
   SELECT COUNT(*) FROM bible_verses;  # Should show 24570+
   \q
   ```

## 🗂️ What Changed

### Directory Structure

**Before:**
```
The Way/
├── app/
├── lib/
├── public/
├── docker-compose.yml
├── package.json
└── README.md
```

**After:**
```
the-way/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/      # Your Next.js app (moved)
│       │   └── lib/      # Your utilities (moved)
│       ├── public/       # Your static files (moved)
│       ├── package.json  # Web-specific deps
│       └── .env.local
├── packages/
│   └── types/
│       └── src/
│           └── index.ts  # Shared TypeScript types
├── database/
│   ├── docker-compose.yml  # Moved here
│   └── scripts/
│       └── import-bible-verses.js  # Moved here
├── package.json          # Workspace config
└── README.md            # Updated docs
```

### Commands Changed

**Before:**
```bash
npm run dev               # Start Next.js
docker compose up -d      # Start database
```

**After:**
```bash
npm run dev              # Still works! Runs web app
npm run db:up            # Start database (cleaner)
npm run db:shell         # Quick access to PostgreSQL
```

## 🔧 Common Issues

### Issue: "Cannot find module '@the-way/types'"

**Solution:**
```bash
# Reinstall workspace dependencies
npm install
```

### Issue: "Database connection failed"

**Solution:**
```bash
# Make sure database is running
npm run db:up

# Check it's running
docker ps | grep postgres
```

### Issue: "Next.js can't find files"

**Solution:**
```bash
# Clear cache
rm -rf apps/web/.next

# Rebuild
cd apps/web
npm run build
```

### Issue: Import paths broken

If `@/lib/db` imports don't work, check `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 🎯 Next Steps After Migration

1. **Test all your existing functionality**
2. **Update any custom scripts** to work with new structure
3. **Add mobile app** when ready: `apps/mobile/`
4. **Create shared utilities** in `packages/` as needed
5. **Document your APIs** in `docs/`

## 🆘 Rollback Plan

If something goes wrong:

```bash
cd "/Users/colinmontes"

# Remove failed migration
rm -rf "The Way"

# Restore from backup
cp -r the-way-backup "The Way"

# Or restore from git
cd "The Way"
git reset --hard HEAD
```

## ✅ Migration Checklist

- [ ] Backup created
- [ ] VS Code closed
- [ ] Database stopped
- [ ] Migration script downloaded
- [ ] Migration script executed
- [ ] Package files copied
- [ ] Dependencies installed
- [ ] Database started
- [ ] Web app starts successfully
- [ ] API endpoints work
- [ ] Bible verses accessible
- [ ] All features tested

## 📞 Need Help?

If you run into issues:
1. Check the error message carefully
2. Verify file locations: `ls -la apps/web/src/`
3. Check database: `npm run db:logs`
4. Ask Claude for help with specific error messages!

---

**Once migration is complete, you'll have a clean, scalable monorepo structure ready for mobile development!** 🎉
