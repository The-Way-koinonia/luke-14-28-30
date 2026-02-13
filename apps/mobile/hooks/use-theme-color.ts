

```ts
/**
 * @module use-theme-color
 * @description Hook for resolving theme-aware colors.
 *
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ---------------------------------------------------------------------------
// Pure Logic (extracted, testable without React)
// ---------------------------------------------------------------------------

/** The set of theme names supported by the color system. */
export type ThemeName = keyof typeof Colors;

/** Optional per-theme color overrides supplied via props. */
export interface ThemeColorOverrides {
  light?: string;
  dark?: string;
}

/** A color key that exists in every theme palette. */
export type SharedColorName = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Resolve a color value for the given theme.
 *
 * Resolution order:
 * 1. Explicit override for the active theme (`overrides[theme]`).
 * 2. Palette value from `Colors[theme][colorName]`.
 *
 * This is a **pure function** — no React, no side-effects — and can be
 * unit-tested in a plain Node.js script.
 *
 * @param theme      - The active color scheme (`'light'` | `'dark'`).
 * @param overrides  - Optional per-theme color strings supplied by the consumer.
 * @param colorName  - Key into the shared color palette.
 * @returns The resolved color string.
 */
export function resolveThemeColor(
  theme: ThemeName,
  overrides: ThemeColorOverrides,
  colorName: SharedColorName,
): string {
  return overrides[theme] ?? Colors[theme][colorName];
}

// ---------------------------------------------------------------------------
// React Hook (thin orchestration layer)
// ---------------------------------------------------------------------------

/**
 * Returns a color string that respects the current color scheme.
 *
 * Consumers may supply explicit `light` / `dark` overrides via `props`;
 * otherwise the value falls through to the shared `Colors` palette.
 *
 * @param props     - Optional per-theme color overrides.
 * @param colorName - Key into the shared color palette.
 * @returns The resolved color string for the active theme.
 */
export function useThemeColor(
  props: ThemeColorOverrides,
  colorName: SharedColorName,
): string {
  const theme: ThemeName = useColorScheme() ?? 'light';
  return resolveThemeColor(theme, props, colorName);
}
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **Logic entangled with hook** | Color resolution lived inside `useThemeColor`; untestable without a React context. | Extracted to `resolveThemeColor` — a **pure function** (input → output) at the top of the file, testable in a plain Node script. |
| **Null-coalescing clarity** | `if / else` branch. | Single `??` expression — same semantics, less surface area. |
| **Type safety** | Inline anonymous types for `props` and `colorName`. | Exported `ThemeName`, `ThemeColorOverrides`, and `SharedColorName` types — reusable & self-documenting. |
| **Documentation** | Bare link comment. | TSDoc on every exported symbol per the Execution Protocol. |
| **No new files** | — | ✅ All changes contained in this single file per the critical constraint. |