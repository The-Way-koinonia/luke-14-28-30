
## Context
As "The Way" monorepo (Turborepo/Next.js/Expo) scales, we identified significant technical debt and "Hotspots" where business logic and data access were tightly coupled with framework-specific layers.

Prior to this change:
- **Mobile**: UI components in Expo (e.g., `read.tsx`) were calling SQLite utility functions directly. Database initialization and raw SQL were scattered across `utils/bibleDb.ts`.
- **Web**: Next.js API logic and authentication queries were performed directly in the delivery layer (e.g., `lib/auth.ts` calling `db.queryOne`).
- **Shared Logic**: There was no formal contract between the shared `bible-engine` and the platform-specific implementations, leading to duplicated adapter logic and difficulty in unit testing business rules.

## Decision
We have implemented a formal **Service/Repository Pattern** across the monorepo to decouple domain logic from infrastructure.

1.  **Shared Interface**: Introduced `IBibleRepository` and `EngineBibleService` within `packages/bible-engine`. This allows the engine to define the business logic for Bible interactions while remaining agnostic of the underlying database (SQLite on Mobile, Postgres on Web).
2.  **Mobile Infrastructure**: 
    - Created `BibleRepository.ts` to encapsulate all `expo-sqlite` operations, including database file provisioning and schema initialization.
    - Created `MetadataRepository.ts` for handling application state and versioning within the local database.
    - Introduced a mobile-specific `BibleService.ts` that initializes the shared `EngineBibleService` with the local repository.
3.  **Web Infrastructure**: 
    - Introduced `AuthRepository.ts` to abstract user-related queries from the `next-auth` configuration.
4.  **UI Decoupling**: Refactored mobile screens and components (`read.tsx`, `MobileStrongsModal.tsx`, `SocialPostCard.tsx`) to interact exclusively with `BibleService`, removing all direct database dependencies.
5.  **Architecture Mapping**: Updated `ARCHITECTURE.md` to track "Hotspot" resolution and provide a roadmap for remaining technical debt (e.g., Admin services).

## Consequences

### Positive
- **Testability**: Business logic in `BibleService` can now be tested using mock repositories without requiring a live SQLite or Postgres connection.
- **Maintainability**: Changes to the database schema only require updates in the Repository layer; the UI and Services remain untouched.
- **Reusability**: The logic for "Formatting Chapters" or "Parsing Verse Refs" is now centralized in the `bible-engine` or the Service layer rather than being duplicated across adapters.
- **Clarity**: The `ARCHITECTURE.md` now reflects a "Source of Truth" for the state of the refactor.

### Negative
- **Indirection**: Developers must now navigate through three layers (Component -> Service -> Repository) for data operations, which increases the number of files per feature.
- **Migration Overhead**: Existing "Hotspots" require significant manual refactoring to comply with the new pattern.

## Compliance

### Security
- **SQL Injection**: All new repository methods (e.g., `BibleRepository.getChapter`) utilize parameterized queries via `expo-sqlite`'s `getAllAsync` to ensure user inputs are sanitized.
- **Auth/RLS**: By moving auth queries to `AuthRepository`, we centralize user data access, making it easier to audit where sensitive user information is retrieved.

### Observability
- **Centralized Logging**: The Service layer now provides a single point of entry for adding performance tracing or error logging (e.g., logging failed Bible lookups or database connection issues).
- **Metadata Tracking**: The `MetadataRepository` standardizes how we track database versions and last-update timestamps, facilitating better debugging of data sync issues in the field.