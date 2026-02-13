

```typescript
// apps/mobile/services/api.ts

import { ApiClient } from '@the-way/api-client';
import { API_BASE_URL } from '@/constants/config';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Pure Logic (extracted, testable without mocking Supabase or ApiClient)
// ---------------------------------------------------------------------------

/**
 * Extracts a usable auth token from a session object.
 * Returns an empty string when no valid token is present.
 *
 * @param session - A session-like object, or null/undefined.
 * @returns The access token string, or '' if absent.
 */
export const resolveAuthToken = (
  session: { access_token?: string | null } | null | undefined,
): string => {
  return session?.access_token ?? '';
};

// ---------------------------------------------------------------------------
// API Client Instance (Incidental / Infrastructure)
// ---------------------------------------------------------------------------

/**
 * Singleton API client configured with the app's base URL.
 * Auth tokens are attached reactively via `onAuthStateChange`.
 */
export const api = new ApiClient({
  baseUrl: API_BASE_URL,
});

// ---------------------------------------------------------------------------
// Auth Token Synchronisation
// ---------------------------------------------------------------------------

/**
 * Keeps the API client's auth header in sync with Supabase auth state.
 *
 * The subscription is module-scoped so it lives for the lifetime of the app.
 * We capture the returned `subscription` to allow deterministic teardown in
 * tests or if the module is ever hot-reloaded.
 */
export const { data: authSubscription } = supabase.auth.onAuthStateChange(
  (_event, session) => {
    api.setAuthToken(resolveAuthToken(session));
  },
);
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **Logic ↔ Infra complected** | Token extraction (`session?.access_token`) was inlined inside the side-effectful callback — untestable without mocking Supabase. | `resolveAuthToken` is a **pure function** (Input → Output) at the top of the file. You can unit-test it with a plain object: `resolveAuthToken({ access_token: 'abc' })`. |
| **Null-safety** | Only checked truthiness of `access_token`; `null` or `undefined` values would fall through to the `else` branch but the intent was implicit. | Uses nullish coalescing (`??`) for explicit, predictable handling of `null`, `undefined`, and missing keys. |
| **Subscription leak** | The return value of `onAuthStateChange` was discarded — no way to unsubscribe. | `authSubscription` is exported so tests or cleanup routines can call `authSubscription.subscription.unsubscribe()`. |
| **Unused parameter** | `event` was declared but never read. | Prefixed as `_event` to satisfy linters and signal intent. |
| **Documentation** | None. | TSDoc on every exported symbol per the Execution Protocol. |