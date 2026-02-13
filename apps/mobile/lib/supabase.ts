

```typescript
// apps/mobile/lib/supabase.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import 'react-native-url-polyfill/auto';

// ---------------------------------------------------------------------------
// Pure Logic: Environment Validation
// ---------------------------------------------------------------------------

/**
 * Zod schema for required Supabase environment variables.
 * Ensures both values are non-empty URL / key strings at startup.
 */
const SupabaseEnvSchema = z.object({
  url: z
    .string({ required_error: 'EXPO_PUBLIC_SUPABASE_URL is required' })
    .url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL'),
  anonKey: z
    .string({ required_error: 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required' })
    .min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY must not be empty'),
});

/** Validated Supabase environment configuration. */
export type SupabaseEnv = z.infer<typeof SupabaseEnvSchema>;

/**
 * Parse and validate raw environment values into a typed {@link SupabaseEnv}.
 *
 * This is a **pure function** — no side-effects, no I/O — so it can be
 * unit-tested in plain Node without any React-Native or Expo mocking.
 *
 * @param rawUrl  - Value of `EXPO_PUBLIC_SUPABASE_URL`  (may be undefined).
 * @param rawKey  - Value of `EXPO_PUBLIC_SUPABASE_ANON_KEY` (may be undefined).
 * @returns A validated {@link SupabaseEnv} object.
 * @throws {z.ZodError} when either value is missing or malformed.
 */
export const parseSupabaseEnv = (
  rawUrl: string | undefined,
  rawKey: string | undefined,
): SupabaseEnv => {
  return SupabaseEnvSchema.parse({ url: rawUrl, anonKey: rawKey });
};

// ---------------------------------------------------------------------------
// Bootstrap: Validate once at module load
// ---------------------------------------------------------------------------

const env = parseSupabaseEnv(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

// ---------------------------------------------------------------------------
// Repository-level client (Incidental Complexity)
// ---------------------------------------------------------------------------

/**
 * Singleton Supabase client for the mobile application.
 *
 * - Session persistence via {@link AsyncStorage}.
 * - Auto-refresh enabled; URL-based session detection disabled (mobile).
 */
export const supabase = createClient(env.url, env.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **Validation** | Soft `console.warn`; empty strings silently passed to `createClient`, producing cryptic runtime errors. | Zod schema validates at startup — fails fast with a clear, typed error. |
| **Pure logic extraction** | Validation was entangled with the client instantiation side-effect. | `parseSupabaseEnv` is a **pure function** (input → output) exportable & testable without mocking Expo or Supabase. |
| **Security (OWASP)** | No input validation on config. | Enforces URL format for the endpoint and non-empty constraint for the key via Zod — prevents misconfigured deployments from reaching production. |
| **Type safety** | Config was `string` (possibly empty). | `SupabaseEnv` type guarantees non-empty, well-formed values downstream. |
| **TSDoc** | None. | Every exported symbol is documented per the Execution Protocol. |