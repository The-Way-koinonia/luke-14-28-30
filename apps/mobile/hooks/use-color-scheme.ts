

```ts
// apps/mobile/hooks/use-color-scheme.ts

/**
 * Re-exports the platform `useColorScheme` hook from React Native.
 *
 * This thin wrapper exists so that every consumer imports from a single,
 * project-owned module rather than directly from `react-native`.
 * Swapping the implementation (e.g. adding persistence, user-override,
 * or a NativeWind adapter) becomes a one-line change here instead of a
 * repo-wide find-and-replace.
 *
 * ### Pure-logic helpers
 * `resolveColorScheme` is a pure function (no React / RN dependency)
 * that collapses the nullable return value of the platform hook into a
 * deterministic, non-null `"light" | "dark"` value.
 *
 * @module useColorScheme
 */

import { useColorScheme as useRNColorScheme, type ColorSchemeName } from 'react-native';

// ---------------------------------------------------------------------------
// Pure Logic (extractable to packages/ui-engine in a future step)
// ---------------------------------------------------------------------------

/** The two concrete color-scheme values the app supports. */
export type ResolvedColorScheme = 'light' | 'dark';

/** Default scheme used when the platform returns `null | undefined`. */
const DEFAULT_SCHEME: ResolvedColorScheme = 'light';

/**
 * Collapse a nullable `ColorSchemeName` into a guaranteed
 * `'light' | 'dark'` value.
 *
 * This is a **pure function** — no React context, no side-effects —
 * and can be unit-tested in a plain Node script.
 *
 * @param scheme - The raw value returned by the platform hook.
 * @param fallback - Optional override for the default (`'light'`).
 * @returns A non-null `ResolvedColorScheme`.
 *
 * @example
 * ```ts
 * resolveColorScheme(null);        // 'light'
 * resolveColorScheme('dark');      // 'dark'
 * resolveColorScheme(null, 'dark'); // 'dark'
 * ```
 */
export const resolveColorScheme = (
  scheme: ColorSchemeName | null | undefined,
  fallback: ResolvedColorScheme = DEFAULT_SCHEME,
): ResolvedColorScheme => {
  if (scheme === 'dark' || scheme === 'light') {
    return scheme;
  }
  return fallback;
};

// ---------------------------------------------------------------------------
// React Hook (Orchestration)
// ---------------------------------------------------------------------------

/**
 * Returns the device's current color scheme, guaranteed non-null.
 *
 * Wraps React Native's `useColorScheme` and feeds it through the pure
 * `resolveColorScheme` helper so consumers never have to null-check.
 *
 * @returns `'light' | 'dark'`
 */
export const useColorScheme = (): ResolvedColorScheme => {
  const rawScheme = useRNColorScheme();
  return resolveColorScheme(rawScheme);
};
```

### What changed and why

| Concern | Before | After |
|---|---|---|
| **Null safety** | `useColorScheme` from RN can return `null`; every consumer had to guard. | `resolveColorScheme` (pure fn) guarantees `'light' \| 'dark'`. |
| **Simple ≠ Easy** | A bare re-export is *easy* but hides an implicit nullable contract — that's complected with every call-site. | The nullable → concrete mapping is *simple*: one pure function, one hook that calls it. |
| **Testability** | Nothing to test. | `resolveColorScheme` is a pure function testable in plain Node — no React, no RN mock needed. |
| **Type contract** | Consumers relied on RN's `ColorSchemeName` (nullable union). | Exported `ResolvedColorScheme` type makes the contract explicit. |
| **Single-file constraint** | — | All logic stays in this file; `resolveColorScheme` is exported and ready to migrate to `packages/ui-engine` in a later step. |
| **TSDoc** | None. | Every export is documented per the Execution Protocol. |