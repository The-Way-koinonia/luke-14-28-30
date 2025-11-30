# 🚀 START HERE - Monorepo Migration Instructions

## 📥 Downloaded Files

You should have these files from Claude:

1. `restructure-monorepo.sh` - Automated migration script
2. `root-package.json` - Root workspace configuration
3. `apps-web-package.json` - Web app package.json
4. `packages-types-package.json` - Types package package.json
5. `packages-types-index.ts` - Shared TypeScript types
6. `packages-types-tsconfig.json` - Types package TypeScript config
7. `README-monorepo.md` - New monorepo README
8. `MIGRATION_GUIDE.md` - Detailed migration guide
9. `monorepo.gitignore` - Updated .gitignore

## ⚡ Quick Migration (5 Minutes)

### Step 1: Backup Your Project

```bash
cd "/Users/colinmontes"
cp -r "The Way" "The Way - Backup $(date +%Y%m%d)"
```

### Step 2: Copy All Files to Project Root

```bash
cd "/Users/colinmontes/The Way"

# Copy all downloaded files here
# (Download them from Claude first)
```

### Step 3: Run the Migration Script

```bash
# Make executable
chmod +x restructure-monorepo.sh

# Run it!
./restructure-monorepo.sh
```

### Step 4: Set Up Package Files

```bash
# Backup current package.json
mv package.json package.json.backup

# Use new root package.json
mv root-package.json package.json

# Set up web app
mv apps-web-package.json apps/web/package.json

# Set up types package
mv packages-types-package.json packages/types/package.json
mkdir -p packages/types/src
mv packages-types-index.ts packages/types/src/index.ts
mv packages-types-tsconfig.json packages/types/tsconfig.json

# Update README
mv README.md README-old.md
mv README-monorepo.md README.md

# Update .gitignore
mv .gitignore .gitignore.old
mv monorepo.gitignore .gitignore
```

### Step 5: Install Dependencies

```bash
# From project root
npm install
```

### Step 6: Start Everything

```bash
# Start database
npm run db:up

# Start web app
npm run dev
```

### Step 7: Verify

1. Open http://localhost:3000
2. Test http://localhost:3000/api/test
3. Everything should work exactly as before!

## 📂 What Each File Does

### `restructure-monorepo.sh`
**Purpose:** Automatically reorganizes your files
**What it does:**
- Creates `apps/web/`, `packages/types/`, `database/` directories
- Moves your Next.js app to `apps/web/src/`
- Moves Docker config to `database/`
- Preserves all your existing code

### `root-package.json`
**Purpose:** Monorepo workspace configuration
**Replaces:** Your current `package.json`
**What it does:**
- Defines npm workspaces
- Provides convenience scripts like `npm run dev`, `npm run db:up`
- Manages all sub-projects

### `apps-web-package.json`
**Purpose:** Web app specific dependencies
**Location:** `apps/web/package.json`
**What it does:**
- Contains Next.js and web-specific packages
- Separate from root to keep things clean

### `packages-types-package.json`
**Purpose:** Shared types package configuration
**Location:** `packages/types/package.json`
**What it does:**
- Allows sharing TypeScript types between web and mobile
- Used like: `import { BibleVerse } from '@the-way/types'`

### `packages-types-index.ts`
**Purpose:** All your shared TypeScript type definitions
**Location:** `packages/types/src/index.ts`
**What it does:**
- Defines types for Bible, User, Post, Church, etc.
- Can be imported in both web and mobile apps

### `packages-types-tsconfig.json`
**Purpose:** TypeScript configuration for types package
**Location:** `packages/types/tsconfig.json`
**What it does:**
- Ensures proper TypeScript compilation for shared types

### `README-monorepo.md`
**Purpose:** Updated documentation
**Replaces:** Your current `README.md`
**What it does:**
- Documents new monorepo structure
- Explains all npm commands
- Provides troubleshooting guide

### `MIGRATION_GUIDE.md`
**Purpose:** Detailed step-by-step migration instructions
**Location:** Keep in project root for reference
**What it does:**
- Explains every step of the migration
- Includes rollback instructions
- Troubleshooting common issues

### `monorepo.gitignore`
**Purpose:** Updated ignore rules for monorepo
**Replaces:** Your current `.gitignore`
**What it does:**
- Ignores node_modules in all workspaces
- Properly handles web and mobile build artifacts

## 🎯 Final Structure

After migration, your project will look like this:

```
The Way/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/          # ← Your Next.js app moved here
│       │   └── lib/          # ← Your utilities moved here
│       ├── public/           # ← Your static files moved here
│       ├── package.json      # ← Web app dependencies
│       └── .env.local
├── packages/
│   └── types/
│       ├── src/
│       │   └── index.ts      # ← Shared TypeScript types
│       ├── package.json
│       └── tsconfig.json
├── database/
│   ├── docker-compose.yml    # ← Moved from root
│   └── scripts/
│       └── import-bible-verses.js  # ← Moved from root
├── package.json              # ← Workspace config
├── README.md                 # ← Updated docs
├── MIGRATION_GUIDE.md        # ← Keep for reference
└── .gitignore                # ← Updated
```

## ✅ Verification Checklist

After migration, verify:

- [ ] `npm install` works without errors
- [ ] `npm run dev` starts the web app
- [ ] http://localhost:3000 loads correctly
- [ ] http://localhost:3000/api/test shows database connection
- [ ] `npm run db:up` starts PostgreSQL
- [ ] `npm run db:shell` opens PostgreSQL shell
- [ ] Bible verses are still in database (SELECT COUNT(*) FROM bible_verses;)

## 🆘 If Something Goes Wrong

### Quick Rollback

```bash
cd "/Users/colinmontes"
rm -rf "The Way"
mv "The Way - Backup YYYYMMDD" "The Way"
```

### Get Help

If you run into issues:
1. Check the error message
2. Look at `MIGRATION_GUIDE.md` troubleshooting section
3. Ask Claude with the specific error

## 🎉 Once Migration is Complete

You can now:

1. ✅ Use cleaner commands: `npm run dev`, `npm run db:up`
2. ✅ Share types between projects: `import { BibleVerse } from '@the-way/types'`
3. ✅ Add mobile app easily: `apps/mobile/`
4. ✅ Keep packages organized and separated
5. ✅ Scale to multiple applications in one repo

## 📞 Next Steps

After successful migration:

1. Test all your existing features
2. Read the new `README.md`
3. Start building new features with the clean structure
4. Consider adding the mobile app: `apps/mobile/`

---

**Ready? Let's do this! Follow the Quick Migration steps above.** 🚀
