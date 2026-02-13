

```typescript
// apps/mobile/hooks/useAdminSession.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// PURE LOGIC (extracted, testable without React or Supabase)
// ---------------------------------------------------------------------------

/** Schema for the raw expiry string coming from the database. */
const ExpiresAtSchema = z.string().datetime({ offset: true });

/** Schema for the RPC response from `request_admin_access`. */
const AdminAccessResponseSchema = z.object({
  success: z.boolean(),
  expires_at: z.string().datetime({ offset: true }),
});

/** Immutable value representing a computed admin session state. */
export interface AdminSessionState {
  readonly expires_at: string;
  readonly isActive: boolean;
  readonly timeLeft: string;
}

/**
 * Compute the session state from an expiry timestamp and a reference "now".
 *
 * Pure function – no side-effects, no Date.now() call.
 *
 * @param expiresAt - ISO-8601 expiry string.
 * @param nowMs     - Current epoch millis (inject for testability).
 * @returns An `AdminSessionState` if the session is still active, otherwise `null`.
 */
export function computeSessionState(
  expiresAt: string,
  nowMs: number,
): AdminSessionState | null {
  const expiryMs = new Date(expiresAt).getTime();
  const diffMs = expiryMs - nowMs;

  if (diffMs <= 0) {
    return null;
  }

  const minutes = Math.floor(diffMs / 60_000);
  return Object.freeze({
    expires_at: expiresAt,
    isActive: true,
    timeLeft: `${minutes}m remaining`,
  });
}

// ---------------------------------------------------------------------------
// HOOK (orchestration only – no business logic beyond calling pure fns)
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 60_000;
/** Supabase PostgREST code for "row not found". */
const ROW_NOT_FOUND = 'PGRST116';

/**
 * Hook that manages the current user's admin session lifecycle.
 *
 * - Fetches the session on mount.
 * - Recalculates `timeLeft` every minute while active.
 * - Exposes `requestAccess` to elevate privileges via RPC.
 */
export function useAdminSession() {
  const [session, setSession] = useState<AdminSessionState | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep a ref to the latest expires_at so the interval callback never
  // closes over stale state (eliminates the react-hooks/exhaustive-deps issue).
  const expiresAtRef = useRef<string | null>(null);

  /** Derive and persist session state from a validated expiry string. */
  const applyExpiry = useCallback((expiresAt: string) => {
    const parsed = ExpiresAtSchema.safeParse(expiresAt);
    if (!parsed.success) {
      console.error('Invalid expires_at value:', parsed.error.format());
      setSession(null);
      expiresAtRef.current = null;
      return;
    }

    const state = computeSessionState(parsed.data, Date.now());
    setSession(state);
    expiresAtRef.current = state ? parsed.data : null;
  }, []);

  /** Fetch the existing admin session row for the current user. */
  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSession(null);
        expiresAtRef.current = null;
        return;
      }

      const { data, error } = await supabase
        .from('admin_sessions')
        .select('expires_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== ROW_NOT_FOUND) {
        console.error('Error fetching admin session:', error);
      }

      if (data?.expires_at) {
        applyExpiry(data.expires_at);
      } else {
        setSession(null);
        expiresAtRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  }, [applyExpiry]);

  /**
   * Request elevated admin access via a Supabase RPC.
   *
   * @returns `true` if access was granted, `false` otherwise.
   */
  const requestAccess = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('request_admin_access');

      if (error) {
        throw error;
      }

      const parsed = AdminAccessResponseSchema.safeParse(data);
      if (!parsed.success) {
        console.error('Unexpected RPC response shape:', parsed.error.format());
        return false;
      }

      if (parsed.data.success) {
        applyExpiry(parsed.data.expires_at);
        return true;
      }

      return false;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to grant admin access.';
      console.error('Failed to request access:', err);
      alert(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [applyExpiry]);

  // --- Lifecycle -------------------------------------------------------
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Countdown tick – uses ref so the callback identity never changes.
  useEffect(() => {
    const interval = setInterval(() => {
      const exp = expiresAtRef.current;
      if (exp) {
        const state = computeSessionState(exp, Date.now());
        setSession(state);
        if (!state) {
          expiresAtRef.current = null;
        }
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return { session, loading, requestAccess } as const;
}
```

### What changed and why

| Concern | Before | After |
|---|---|---|
| **Logic × State complecting** | `updateSessionState` mixed pure date math with `setSession` | `computeSessionState` is a **pure, exported function** (testable with plain `assert`). |
| **Validation** | Raw `data.expires_at` and `data.success` trusted blindly | Every external boundary validated with **Zod** (`ExpiresAtSchema`, `AdminAccessResponseSchema`). |
| **Stale closure / exhaustive-deps** | `useEffect` closed over `session` but suppressed the lint rule | `expiresAtRef` tracks the latest `expires_at`; interval callback has **no stale captures**. Lint rule no longer needs suppression. |
| **Error typing** | `catch (error: any)` | `catch (err: unknown)` with `instanceof Error` guard — stricter, no `any`. |
| **Immutability** | Mutable object literal passed to state | `Object.freeze` on returned value; interface marked `readonly`. |
| **Testability** | `Date.now()` baked into logic | `nowMs` injected as parameter — deterministic unit tests. |
| **Constants** | Magic strings/numbers inline | `ROW_NOT_FOUND`, `REFRESH_INTERVAL_MS` named at module scope. |