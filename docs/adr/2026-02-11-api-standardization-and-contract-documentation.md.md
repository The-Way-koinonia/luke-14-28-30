
## Context
As "The Way" scales across its Turborepo (Next.js and Expo), the lack of a formalized API contract has become a bottleneck for cross-platform development. Mobile (Expo) and Web (Next.js) consumers lacked a "Source of Truth" for backend capabilities, leading to drift between the frontend implementation and the Supabase/Next.js backend logic. 

Furthermore, development standards were implicit rather than codified, resulting in inconsistent code quality, missing documentation (TSDoc), and varying levels of security/observability across the monorepo.

## Decision
We have implemented a comprehensive API documentation and development standardization layer:

1.  **OpenAPI 3.0 Integration**: Integrated `next-swagger-doc` and `swagger-ui-react` into `apps/web`. This provides a live, interactive API reference at `/docs` generated from `@swagger` JSDoc blocks in Next.js API routes.
2.  **Strict Schema Validation**: Introduced `zod` for API response and request validation, starting with a new `/api/health` monitoring endpoint to ensure internal state consistency.
3.  **Codified Development Standards (`PROMPTS.md`)**: Replaced the generic prompt template with a project-specific "Lead Architect" manifest. This mandates:
    *   **Architecture**: Service/Repository pattern (emulating Cal.com).
    *   **Security**: OWASP Top 10, Zod validation, and Supabase RLS (Row Level Security).
    *   **Observability**: Mandatory OpenTelemetry spans for critical user flows.
    *   **Documentation**: Mandatory TSDoc for all exported functions and JSDoc for API routes.
4.  **Automated ADR Pipeline**: Acknowledged and finalized the integration of a `post-commit` hook (via Gemini AI) to ensure architectural changes are documented in `docs/adr/` in real-time.

## Consequences

### Positive
*   **Contract-First Development**: Mobile engineers can now build against the Swagger UI spec without digging into the web package's source code.
*   **Reduced Logic Drift**: Business logic is increasingly decoupled from framework code (Service/Repo pattern), making the codebase more portable.
*   **Enhanced Security**: Standardizing Zod and RLS patterns in the project "Source of Truth" reduces the likelihood of data leaks.
*   **Improved Onboarding**: New developers have a clear reference for the tech stack and coding standards via the revised `PROMPTS.md`.

### Negative
*   **Maintenance Overhead**: Developers must now maintain JSDoc/TSDoc blocks alongside code changes to keep documentation accurate.
*   **Bundle Size**: Addition of Swagger UI dependencies to `apps/web` (mitigated by dynamic loading/CSR).
*   **API Dependency**: The automated ADR generation requires a valid Gemini API key in the local environment.

## Compliance

### Security
*   **Auth & RLS**: The `PROMPTS.md` now explicitly requires all AI-generated and manual code to adhere to Supabase RLS policies.
*   **Input Validation**: Zod is now the standard for all API entry points to prevent injection and malformed data processing.
*   **Secret Management**: Re-emphasized the prohibition of hardcoded secrets across the monorepo.

### Observability
*   **OpenTelemetry**: The architecture now mandates the use of OTel spans for critical flows (Sync, Video Processing, Auth). 
*   **Health Checks**: The `/api/health` endpoint provides a standardized way for Vercel or other monitoring tools to verify system uptime and environment status.
*   **Auditability**: Automated ADRs provide a clear, timestamped audit trail of all significant architectural shifts.