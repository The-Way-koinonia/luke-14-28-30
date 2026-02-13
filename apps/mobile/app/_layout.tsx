

```tsx
// apps/mobile/app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { checkForDatabaseUpdates } from '@/services/database/updateChecker';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// PURE LOGIC: De-complected from UI & Navigation internals.
// These functions are testable in a plain Node.js script.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determines the navigation intent based on the current auth state and route segment.
 *
 * @param isAuthenticated - Whether a valid session exists.
 * @param topSegment - The first segment of the current route (e.g., '(auth)', '(tabs)').
 * @returns A redirect target path, or `null` if no navigation change is needed.
 */
export function resolveAuthRedirect(
  isAuthenticated: boolean,
  topSegment: string | undefined,
): '/(auth)/login' | '/(tabs)' | null {
  const inAuthGroup = topSegment === '(auth)';

  if (!isAuthenticated && !inAuthGroup) {
    return '/(auth)/login';
  }
  if (isAuthenticated && inAuthGroup) {
    return '/(tabs)';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Delay (ms) to allow the Expo Router navigation tree to mount before programmatic navigation. */
const NAVIGATION_READY_DELAY_MS = 100;

export const unstable_settings = {
  anchor: '(tabs)',
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inner layout component that owns the navigation stack and auth-based redirects.
 * Separated from `RootLayout` so that `useAuth()` runs inside `<AuthProvider>`.
 */
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Wait for the navigation tree to fully mount before attempting programmatic navigation.
  useEffect(() => {
    const timer = setTimeout(() => setIsNavigationReady(true), NAVIGATION_READY_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Auth guard: redirect based on pure logic.
  useEffect(() => {
    if (isLoading || !isNavigationReady) return;

    const redirect = resolveAuthRedirect(!!session, segments[0] as string | undefined);

    if (redirect) {
      router.replace(redirect);
    }
  }, [session, segments, isLoading, isNavigationReady, router]);

  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="studio"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

/**
 * Root layout — the outermost provider boundary.
 * Triggers a silent background database update check on mount.
 */
export default function RootLayout() {
  const handleStartupUpdateCheck = useCallback(() => {
    checkForDatabaseUpdates({ silent: true }).catch((err: unknown) => {
      // Intentionally non-blocking; logged for observability.
      console.error('[RootLayout] Startup database update check failed:', err);
    });
  }, []);

  useEffect(() => {
    handleStartupUpdateCheck();
  }, [handleStartupUpdateCheck]);

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
```

### What changed and why

| Concern | Before | After |
|---|---|---|
| **Logic ↔ Navigation complecting** | Auth redirect decisions were inline inside the `useEffect`, braiding boolean checks with `router.replace` calls. | Extracted `resolveAuthRedirect` — a **pure function** (Input → Output, no side effects) testable in a plain Node script. The `useEffect` only acts on its return value. |
| **Magic numbers** | `100` ms delay appeared without context. | Named constant `NAVIGATION_READY_DELAY_MS` with a TSDoc comment explaining intent. |
| **Typed errors / safety** | `catch(err =>` used untyped `err`. | `catch((err: unknown) =>` — explicit unknown per strict TS / security protocol. |
| **Stable callback reference** | `checkForDatabaseUpdates` was called in an anonymous closure, recreated on every render (benign here, but un-idiomatic). | Wrapped in `useCallback` for referential stability; effect depends on the stable ref. |
| **TSDoc** | No documentation on any function. | All exported functions and the two components have TSDoc comments. |
| **Dependency arrays** | `router` was omitted from the auth-guard effect's dependency array (ESLint exhaustive-deps warning). | `router` is now included. |