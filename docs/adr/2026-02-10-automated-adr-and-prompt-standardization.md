
# ADR: Automated ADR Generation and Production-Grade Prompting Standards

## Context
As "The Way" scales across Turborepo, Next.js, and Expo, maintaining architectural consistency and documentation has become a manual bottleneck. Architectural decisions were often made during the commit process but rarely documented in a centralized, searchable format. Furthermore, AI-assisted development lacked a "Source of Truth" for quality, leading to inconsistent code patterns that didn't always follow our preferred Service/Repository or RLS patterns.

Before this change, ADRs were manual, and developers had no shared template for high-quality LLM prompts tailored to our specific stack (Supabase, Cal.com patterns, Expo Router).

## Decision
We have implemented an automated Architectural Decision Record (ADR) pipeline and a standardized prompting manifest:

1.  **Automated ADR Pipeline**: 
    *   Integrated **Husky** to manage git hooks.
    *   Added a `post-commit` hook that triggers a custom script (`scripts/generate-adr.js`).
    *   Utilized **Google Gemini AI (1.5 Pro)** to analyze `git diff` outputs and generate structured ADRs automatically in `docs/adr/`.
2.  **Prompt Standardization**:
    *   Created `PROMPTS.md` to serve as the master reference for all AI interactions.
    *   Established a "Production-Grade" template emphasizing Security (OWASP), Performance (Big O), and Reliability.
    *   Explicitly linked our architecture to high-quality references: Supabase Studio (RLS), Cal.com (Service/Repo), and Expo templates.
3.  **Tooling Integration**:
    *   Added `@google/generative-ai` and `dotenv` to manage AI synthesis and environment configuration.

## Consequences

### Positive
*   **Documentation Velocity**: ADRs are now generated as a side-effect of committing code, ensuring the `docs/adr/` folder stays in sync with architectural shifts.
*   **Architectural Alignment**: By codifying "The Way" in `PROMPTS.md`, we ensure that any AI-generated code follows our specific patterns (Service/Repo, RLS safety).
*   **Knowledge Transfer**: New contributors can reference `PROMPTS.md` to understand the "Gold Standard" repositories we emulate.

### Negative
*   **API Dependency**: Generating ADRs now requires a `GEMINI_API_KEY`. If the key is missing or the service is down, the script will fail (though it is designed to fail gracefully without blocking the commit).
*   **Review Overhead**: AI-generated ADRs are "drafts" by nature. They require a human review to ensure the AI correctly interpreted the *intent* behind the code change.
*   **Token Usage**: Large diffs are truncated at 50,000 characters to fit context windows, which might miss nuances in massive refactors.

## Compliance

### Security
*   **API Key Management**: The `GEMINI_API_KEY` is loaded via `dotenv`. It must never be committed to version control.
*   **Code Quality**: The new `PROMPTS.md` explicitly mandates OWASP Top 10 compliance and parameterized inputs for all generated code.
*   **RLS (Row Level Security)**: All prompts are now instructed to emulate Supabase RLS patterns to ensure data isolation.

### Observability
*   **Script Logging**: The `generate-adr.js` script provides clear console output (🤖, ✅, ❌) to inform developers of the automation status.
*   **Audit Trail**: Automated ADRs provide a historical record of changes that can be audited during security or architectural reviews.