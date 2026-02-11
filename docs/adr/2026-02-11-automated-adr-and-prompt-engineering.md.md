
## Context
As "The Way" scales across its Turborepo (Next.js/Expo), architectural consistency and documentation often lag behind rapid development. Architectural decisions are frequently buried in Git history without formal records, making it difficult for new engineers or AI agents to understand the "why" behind changes. Furthermore, as we increasingly use LLMs for code generation, we lacked a centralized "Source of Truth" for project-specific constraints, security standards (RLS/OWASP), and reference patterns (Cal.com/Supabase).

## Decision
We have implemented an automated Architectural Decision Record (ADR) generation pipeline and a project-wide prompting standard.

1.  **Automated Documentation**: Added `scripts/generate-adr.js` which utilizes the Google Gemini 1.5 Pro model to analyze git diffs.
2.  **Git Integration**: Configured `Husky` to trigger the ADR generation script in a `post-commit` hook. This ensures that every significant change is analyzed and documented in `docs/adr/`.
3.  **Architectural North Star**: Created `PROMPTS.md` to define our "Production-Grade Prompt Template." This file codifies our reliance on the Service/Repository pattern (via Cal.com), Supabase RLS safety, and specific performance constraints for SQLite/verse lookups.
4.  **Dependency Alignment**: Introduced `@google/generative-ai` for the analysis engine and `dotenv` for secure environment variable management during local development.

## Consequences

### Positive
*   **Documentation Continuity**: Architectural shifts are now automatically captured, reducing documentation debt.
*   **AI Alignment**: The `PROMPTS.md` provides a reusable context block that ensures AI-generated code adheres to "The Way" standards (e.g., decoupled business logic).
*   **Audit Trail**: The `docs/adr` folder becomes a living history of the project’s evolution.

### Negative
*   **External Dependency**: The ADR generation relies on the availability of the Gemini API.
*   **Context Limits**: Large diffs (over 50,000 characters) are truncated, which may lead to missing nuances in massive refactors.
*   **API Costs**: While currently within free/low-tier usage, frequent commits will consume API quota.

## Compliance

### Security
*   **Secret Management**: The `generate-adr.js` script explicitly requires `GEMINI_API_KEY` via `.env`. A check is in place to ensure secrets are not hardcoded.
*   **Safety Standards**: `PROMPTS.md` explicitly mandates OWASP Top 10 compliance and PostgreSQL RLS safety patterns for all future feature implementations.

### Observability
*   **Generation Logging**: The script provides console feedback during the `post-commit` phase, alerting developers if a record was generated or if the diff was empty.
*   **Traceability**: Each ADR is mapped to the logic of the specific git diff that triggered it, providing a direct link between code change and architectural justification.