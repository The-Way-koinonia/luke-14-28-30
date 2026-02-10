// Shared TypeScript types for The Way monorepo
/**
 * SHARED TYPES FOR THE WAY MONOREPO
 *
 * Purpose: These types represent the canonical data models shared across all applications
 * in The Way monorepo including mobile app, web app, and API server. These types define
 * the rich, fully-populated data structures used for API communication and UI rendering.
 *
 * Characteristics:
 * - Includes all fields needed for complete feature functionality
 * - Contains optional "populated fields" that may be joined from related tables
 * - Optimized for developer experience and type safety across the entire platform
 * - Represents the source of truth for cross-platform data contracts
 *
 * Guidelines:
 * - Use these types when communicating between client and server via API
 * - Use these types when rendering UI components that need rich data
 * - Changes to these types affect all apps - coordinate with all teams
 * - Breaking changes require migration plans for all consuming applications
 *
 * Note: Individual apps may have their own internal types optimized for specific needs
 * like persistence, caching, or offline sync. Those app-specific types should transform
 * to/from these shared types at application boundaries.
 */
export {};
