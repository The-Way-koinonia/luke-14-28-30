

```typescript
// apps/mobile/hooks/useBiometricAuth.ts

import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// 1. PURE LOGIC — De-complected from UI and side-effects
//    Testable in a plain Node.js script without mocking Expo or React Native.
// ---------------------------------------------------------------------------

/**
 * Determines whether biometric authentication is available.
 * @param hardwareAvailable - Whether the device has biometric hardware.
 * @param enrolled - Whether the user has enrolled biometric credentials.
 * @returns `true` when both hardware exists and credentials are enrolled.
 */
export const isBiometricAvailable = (
  hardwareAvailable: boolean,
  enrolled: boolean,
): boolean => hardwareAvailable && enrolled;

/** Zod schema that validates the shape returned by `LocalAuthentication.authenticateAsync`. */
const AuthResultSchema = z.union([
  z.object({ success: z.literal(true) }),
  z.object({ success: z.literal(false), error: z.string() }),
]);

/** Validated authentication result. */
export type AuthResult = z.infer<typeof AuthResultSchema>;

/**
 * Interprets a raw biometric authentication result into a domain outcome.
 *
 * @param raw - The result object from the platform authenticator.
 * @returns A discriminated-union outcome:
 *  - `{ status: 'success' }`
 *  - `{ status: 'cancelled' }`
 *  - `{ status: 'failed', error: string }`
 */
export const interpretAuthResult = (
  raw: unknown,
): { status: 'success' } | { status: 'cancelled' } | { status: 'failed'; error: string } => {
  const parsed = AuthResultSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: 'failed', error: 'Unexpected authentication result shape.' };
  }

  const result = parsed.data;

  if (result.success) {
    return { status: 'success' };
  }

  // "user_cancel" / "system_cancel" should not be treated as errors.
  if ('error' in result && (result.error === 'user_cancel' || result.error === 'system_cancel')) {
    return { status: 'cancelled' };
  }

  return { status: 'failed', error: 'error' in result ? result.error : 'Unknown error' };
};

// ---------------------------------------------------------------------------
// 2. HOOK — Thin orchestration layer (State + Side-effects only)
// ---------------------------------------------------------------------------

/** Default prompt options kept as an immutable value. */
const DEFAULT_AUTH_OPTIONS: LocalAuthentication.LocalAuthenticationOptions = {
  promptMessage: 'Authenticate to continue',
  fallbackLabel: 'Use Passcode',
} as const;

/**
 * Provides biometric authentication state and an `authenticate` action.
 *
 * All business logic (availability check, result interpretation) is delegated
 * to the pure functions above so they remain testable without Expo mocks.
 */
export function useBiometricAuth() {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- Capability probe (runs once on mount) ---
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      try {
        const [hardware, enrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);

        if (!cancelled) {
          setIsBiometricSupported(isBiometricAvailable(hardware, enrolled));
        }
      } catch (error) {
        // Hardware probe failure is non-fatal; biometrics simply stay unavailable.
        console.warn('[useBiometricAuth] capability probe failed:', error);
      }
    };

    probe();

    return () => {
      cancelled = true;
    };
  }, []);

  // --- Authentication action ---
  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const raw = await LocalAuthentication.authenticateAsync(DEFAULT_AUTH_OPTIONS);
      const outcome = interpretAuthResult(raw);

      switch (outcome.status) {
        case 'success':
          setIsAuthenticated(true);
          return true;

        case 'cancelled':
          // User intentionally dismissed — no alert, no error.
          return false;

        case 'failed':
          Alert.alert('Authentication Failed', 'Please try again.');
          return false;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useBiometricAuth] authenticate error:', message);
      Alert.alert('Error', 'Biometric authentication failed.');
      return false;
    }
  }, []);

  return { isBiometricSupported, isAuthenticated, authenticate } as const;
}
```

### What changed & why

| Concern | Before (Complected) | After (Simple) |
|---|---|---|
| **Availability logic** | Inline `compatible && enrolled` inside an anonymous `useEffect` async IIFE — untestable without mocking Expo. | Extracted to `isBiometricAvailable(boolean, boolean)` — a pure function at the top of the file. |
| **Result interpretation** | `if/else` chain directly mutating state and calling `Alert` — logic, side-effects, and UI entangled. | `interpretAuthResult(unknown)` returns an immutable discriminated union (`success | cancelled | failed`). The hook's `switch` is a thin side-effect dispatcher. |
| **Validation (Zod)** | None. Raw Expo result trusted without validation. | `AuthResultSchema` validates the shape before interpretation — satisfies the Security protocol. |
| **Cancellation handling** | Only `user_cancel` was suppressed. | Both `user_cancel` and `system_cancel` are treated as non-error cancellations. |
| **Effect cleanup** | Missing — stale `setState` could fire on unmounted component. | `cancelled` flag prevents state updates after unmount. |
| **Parallelism** | Sequential `await` for two independent hardware checks. | `Promise.all` runs both probes concurrently. |
| **Memoisation** | `authenticate` re-created every render. | Wrapped in `useCallback` with stable identity. |
| **Auth options** | Inline object literal (re-allocated each call). | `DEFAULT_AUTH_OPTIONS` — immutable value defined once (Values over Objects). |
| **Error typing** | `catch (error)` with implicit `any`. | `catch (error: unknown)` with safe narrowing. |