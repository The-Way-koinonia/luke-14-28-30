# Project Architecture & Source of Truth

This document maps the current state of "The Way" monorepo. It identifies "Hotspots" (🚨) where business logic is coupled with framework code, and prescribes their future location in a clean Service/Repository architecture.

## 📂 Repository Structure

```text
/
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   └── login.tsx 🚨 -> Move auth logic to hooks/useAuth.ts
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── feed.tsx 🚨 -> Move data fetching to hooks/useFeed.ts
│   │   │   │   ├── profile.tsx
│   │   │   │   └── read.tsx 🚨 -> Move Bible state to hooks/useBible.ts
│   │   │   ├── profile/
│   │   │   │   └── edit.tsx 🚨 -> Move profile update logic to repositories/ProfileRepository.ts
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   │   ├── feed/
│   │   │   │   ├── SmartFeedList.tsx
│   │   │   │   └── SocialPostCard.tsx
│   │   │   ├── ComposePostModal.tsx
│   │   │   └── MobileStrongsModal.tsx
│   │   ├── repositories/
│   │   │   └── BibleRepository.ts
│   │   ├── services/
│   │   │   ├── BibleService.ts
│   │   │   ├── database/
│   │   │   │   ├── updateChecker.ts 🚨 -> Extract SQL to repositories/MetadataRepository.ts
│   │   │   │   └── updateApplier.ts 🚨 -> Extract SQL to repositories/MetadataRepository.ts
│   │   └── utils/
│   │       ├── mobileSocialAdapter.ts 🚨 -> Move to apps/mobile/repositories/SocialRepository.ts
│   │       └── security.ts
│   │
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (social)/
│       │   │   │   └── feed/
│       │   │   ├── api/
│       │   │   │   ├── bible/
│       │   │   │   │   ├── books/route.ts (Calls BibleService)
│       │   │   │   │   └── verses/route.ts (Calls BibleService)
│       │   │   │   ├── social/
│       │   │   │   │   ├── feed/route.ts (Calls SocialService ✅)
│       │   │   │   │   └── posts/route.ts (Calls SocialService ✅)
│       │   │   │   └── health/route.ts
│       │   ├── lib/
│       │   │   ├── adapters/
│       │   │   │   └── webBibleAdapter.ts 🚨 -> Move to repositories/BibleRepository.ts
│       │   │   ├── db/
│       │   │   │   └── repositories/
│       │   │   │       ├── auth.repository.ts
│       │   │   │       └── social.repository.ts
│       │   │   ├── services/
│       │   │   │   ├── social.service.ts
│       │   │   │   └── bible.service.ts
│       │   │   ├── auth.ts (Uses AuthRepository ✅)
│       │   │   ├── supabase.ts
│       │   │   └── swagger.ts
│       │   └── components/
│       │       └── swagger-ui.tsx
│
└── packages/
    ├── bible-engine/
    │   ├── src/
    │   │   ├── index.ts
    │   │   ├── repositories/
    │   │   │   └── IBibleRepository.ts
    │   │   ├── services/
    │   │   │   └── BibleService.ts
    │   │   └── types.ts
    │   └── package.json
    ├── social-engine/
    │   ├── src/
    │   │   ├── index.ts
    │   │   ├── types.ts
    │   │   └── useFeed.ts
    │   └── package.json
    ├── memory-engine/
    ├── api-client/
    └── types/
```

## 🚨 Hotspot Analysis

### 1. Mobile Database Access (`apps/mobile/repositories`)
*   **Status:** ✅ Refactored to Repository Pattern.
*   **Location:** `apps/mobile/repositories/BibleRepository.ts`
*   **Role:** Handles all direct SQLite interactions.

### 2. Web API Logic (`apps/web/src/app/api`)
*   **Current:** Validation, Auth, and DB queries all inside `route.ts`.
*   **Target:** `apps/web/services/*` (Business Logic) & `apps/web/repositories/*` (Data Access).
*   **Why:** API routes should only handle Request/Response mapping. Business logic should be testable in isolation.

### 3. UI Component Logic (`apps/mobile/app`)
*   **Current:** `useEffect` fetching data directly in screens.
*   **Target:** Custom Hooks (`packages/social-engine/src/useFeed.ts` is a good start).
*   **Progress:** `read.tsx` now calls `BibleService` (✅), decoupling DB logic.

### 4. Technical Debt Audit (Phase 9 Findings)
*   **Web Auth**: `apps/web/src/lib/auth.ts` refactored to `AuthRepository` (✅).
*   **Web Admin**: `seed-bible/route.ts` contains raw SQL. Target: `AdminService`.
*   **Mobile Updates**: `updateChecker.ts` refactored to `MetadataRepository` (✅).

## 🗺️ Migration Path

1.  **Extract Repositories**: Move raw SQL/Supabase calls to `repositories/`.
2.  **Create Services**: Move complex logic (e.g. "Create Post with Notification") to `services/`.
3.  **Refactor Hooks**: Update UI to call Hooks -> Services -> Repositories.
