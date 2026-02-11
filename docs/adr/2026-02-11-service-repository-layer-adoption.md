
## Context
As "The Way" monorepo expands across Web (Next.js) and Mobile (Expo), we have identified significant "Hotspots" where business logic, data validation, and database queries are tightly coupled with framework-specific code (e.g., Next.js `route.ts` files and Expo UI screens). 

Before this change:
- Data fetching was often handled directly in UI components via `useEffect`.
- API routes contained raw SQL or adapter logic, making them difficult to unit test.
- Mobile database access via `expo-sqlite` was scattered across utility files rather than being abstracted.
- There was no unified map of the architecture, leading to "logic drift" between platforms.

## Decision
We have formally adopted a **Service/Repository Pattern** to decouple business logic from framework delivery layers. This decision includes:

1.  **Architecture Mapping**: Created `ARCHITECTURE.md` to serve as the "Source of Truth" for the monorepo structure, identifying specific areas (Hotspots) requiring refactoring.
2.  **Repository Layer**: Implementation of dedicated Repository classes (e.g., `BibleRepository`) responsible strictly for data access and raw queries. This layer uses parameterized SQL for security and is the only place interacting with the database/ORM.
3.  **Service Layer**: Implementation of Service classes (e.g., `BibleService`) to house domain-specific business logic, such as filtering, error handling, and orchestrating multiple repository calls.
4.  **API Refactoring**: Next.js API routes are now restricted to Request/Response mapping, delegating all logic to the Service layer.
5.  **Standardized Prompts**: Updated `PROMPTS.md` to ensure the "Lead Architect" persona enforces this pattern in all future code generation.

## Consequences

### Positive
- **Testability**: Business logic in Services can now be tested in isolation without mocking the entire Next.js request lifecycle or UI context.
- **Portability**: The logic within `packages/` and `services/` is more easily shared or moved as framework versions evolve.
- **Maintainability**: The `ARCHITECTURE.md` file provides a clear roadmap for technical debt reduction, highlighting exactly which files need refactoring.
- **Consistency**: Class-based Services and Repositories provide a predictable structure for developers to follow.

### Negative
- **Boilerplate**: Simple CRUD operations now require more files (Route -> Service -> Repository), which may feel heavy for trivial features.
- **Refactoring Effort**: Significant effort is required to migrate existing "Hotspots" identified in the mobile and web apps.

## Compliance

### Security
- **SQL Injection**: All queries in the new `BibleRepository` use parameterized inputs (`$1`, `$2`) to prevent injection attacks.
- **Authentication/RLS**: The Service layer is positioned to check user context before calling Repositories, ensuring Supabase Row Level Security (RLS) is respected and augmented by application-level checks.

### Observability
- **Centralized Error Handling**: By moving logic into Services, we can implement unified logging and OpenTelemetry spans for database operations and business logic execution.
- **Health Checks**: The framework is now prepared for more granular health monitoring by checking service-level availability.