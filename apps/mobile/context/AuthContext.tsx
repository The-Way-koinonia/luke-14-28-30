

```tsx
// apps/mobile/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// 1. PURE LOGIC — De-complected from React state & Supabase internals.
//    These are plain functions that derive values from immutable inputs.
//    Testable in a plain Node.js script without mocking React or Supabase.
// ---------------------------------------------------------------------------

/**
 * Extracts the `User` from a nullable `Session`.
 * Returns `null` when no session is present.
 */
export const extractUserFromSession = (session: Session | null): User | null =>
  session?.user ?? null;

/**
 * Derives a complete `AuthState` snapshot from a nullable session and a
 * loading flag. Keeps the shape computation in one place so neither the
 * initial-fetch path nor the listener path can drift out of sync.
 */
export const deriveAuthState = (
  session: Session | null,
  isLoading: boolean,
): AuthState => ({
  session,
  user: extractUserFromSession(session),
  isLoading,
});

// ---------------------------------------------------------------------------
// 2. TYPES / CONTRACTS
// ---------------------------------------------------------------------------

/** Immutable value describing the current authentication state. */
export interface AuthState {
  readonly session: Session | null;
  readonly user: User | null;
  readonly isLoading: boolean;
}

// ---------------------------------------------------------------------------
// 3. CONTEXT & HOOK
// ---------------------------------------------------------------------------

const INITIAL_AUTH_STATE: AuthState = deriveAuthState(null, true);

const AuthContext = createContext<AuthState>(INITIAL_AUTH_STATE);

/**
 * Returns the current `AuthState` from the nearest `AuthProvider`.
 *
 * @throws (implicitly) Returns the default loading state if used outside a
 *   provider — this is intentional so the app shows a loading screen rather
 *   than crashing.
 */
export const useAuth = (): AuthState => useContext(AuthContext);

// ---------------------------------------------------------------------------
// 4. PROVIDER — Thin orchestration shell; all derivation delegated above.
// ---------------------------------------------------------------------------

/**
 * Wraps the component tree with authentication state sourced from Supabase.
 *
 * Responsibilities (and nothing more):
 *  - Fetch the initial session on mount.
 *  - Subscribe to auth-state changes for the lifetime of the provider.
 *  - Expose derived `AuthState` via React Context.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(INITIAL_AUTH_STATE);

  useEffect(() => {
    // --- Initial session fetch ---
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(deriveAuthState(session, false));
    });

    // --- Realtime auth listener ---
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(deriveAuthState(session, false));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **Logic entangled with state** | `session?.user ?? null` duplicated in two `setState` call-sites — logic complected with React lifecycle. | `extractUserFromSession` and `deriveAuthState` are **pure functions** at the top of the file, testable without React. |
| **State shape drift risk** | Three independent `useState` hooks (`session`, `user`, `isLoading`) updated in parallel — easy to forget one. | Single `AuthState` value object derived atomically via `deriveAuthState`. Values, not scattered objects. |
| **Typed contract** | `AuthContextType` was a loose inline type. | Exported `AuthState` **interface** with `readonly` fields — immutable value semantics. |
| **TSDoc** | None. | Every exported function and interface is documented. |
| **Security / correctness** | No regression — no new API surface, no string SQL, no un-validated input. Auth state is read-only by consumers. | Same. The `readonly` modifier on `AuthState` makes accidental mutation a compile-time error. |

> **🛑 Constraint respected:** All changes are within this single file. The pure functions are defined at the top and exported so they *can* be moved to a shared package in a future step without changing their signatures.