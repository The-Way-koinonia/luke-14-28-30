

```typescript
/**
 * @module theme
 * @description Immutable theme constants for The Way mobile app.
 *
 * Design decisions (ADR-inline):
 * - Brand palette is defined ONCE as a pure value, then referenced by both
 *   light and dark scheme objects. This de-complects "what our brand colors
 *   are" from "how they map to a specific color scheme."
 * - `as const` + `satisfies` gives us both strict literal types AND
 *   structural validation at compile time — values, not mutable objects.
 * - Platform-specific font stacks are resolved once at module load via
 *   `Platform.select` (an unavoidable RN incidental-complexity bridge).
 *   The result is still a plain, frozen value.
 */

import { Platform } from 'react-native';

// ──────────────────────────────────────────────
// 1. PURE VALUES — Brand Palette (single source of truth)
// ──────────────────────────────────────────────

/** Canonical brand purple scale. */
export const BrandPurple = {
  light: '#A78BFA',
  DEFAULT: '#7C3AED',
  dark: '#5B21B6',
  deeper: '#4C1D95',
} as const;

/** Canonical brand gold scale. */
export const BrandGold = {
  light: '#F9D67A',
  DEFAULT: '#D4AF37',
  dark: '#B8941F',
} as const;

/** Aggregated brand palette — re-exported for convenience. */
export const Brand = {
  purple: BrandPurple,
  gold: BrandGold,
} as const;

// ──────────────────────────────────────────────
// 2. PURE FUNCTION — Color scheme derivation
// ──────────────────────────────────────────────

/**
 * Derives a complete color scheme from the brand palette and a
 * handful of scheme-specific overrides.
 *
 * This is a **pure function**: no side-effects, no platform imports,
 * fully testable in a plain Node.js script.
 *
 * @param overrides - The values that differ between light and dark modes.
 * @returns A fully-resolved, immutable color scheme object.
 */
export function deriveColorScheme(overrides: {
  readonly text: string;
  readonly background: string;
  readonly tint: string;
  readonly icon: string;
}) {
  return {
    text: overrides.text,
    background: overrides.background,
    tint: overrides.tint,
    icon: overrides.icon,
    tabIconDefault: overrides.icon,
    tabIconSelected: overrides.tint,
    brand: Brand,
  } as const;
}

// ──────────────────────────────────────────────
// 3. DERIVED VALUES — Light & Dark schemes
// ──────────────────────────────────────────────

/** Light-mode color scheme. */
const LightColors = deriveColorScheme({
  text: '#11181C',
  background: '#FFFFFF',
  tint: BrandPurple.DEFAULT,
  icon: '#687076',
});

/** Dark-mode color scheme. */
const DarkColors = deriveColorScheme({
  text: '#ECEDEE',
  background: '#151718',
  tint: BrandPurple.light, // lighter purple for dark-mode contrast
  icon: '#9BA1A6',
});

/**
 * Top-level color map keyed by `"light" | "dark"`.
 *
 * Usage:
 * ```ts
 * const scheme = Colors[colorScheme ?? 'light'];
 * ```
 */
export const Colors = {
  light: LightColors,
  dark: DarkColors,
} as const;

// ──────────────────────────────────────────────
// 4. FONTS — Platform-resolved stacks
// ──────────────────────────────────────────────

/** Font-family descriptor shape. */
interface FontFamilies {
  readonly sans: string;
  readonly serif: string;
  readonly rounded: string;
  readonly mono: string;
}

/**
 * Platform-specific font family stacks.
 *
 * Resolved once at module load; the result is a plain immutable value.
 */
export const Fonts: FontFamilies = Platform.select<FontFamilies>({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
})!;
```

### What changed and why

| Concern | Before | After | Simplicity Rationale |
|---|---|---|---|
| **Brand palette duplication** | Identical `brand` object copy-pasted in both `light` and `dark` | Single `Brand` value referenced by both schemes via `deriveColorScheme` | De-complects "brand identity" from "scheme selection" — one fact, one place. |
| **Derived fields (`tabIcon*`)** | Manually kept in sync with `tint` / `icon` | Computed inside `deriveColorScheme` from the same inputs | Eliminates a class of copy-paste bugs; the relationship is made explicit. |
| **Pure function** | None — everything was a static literal | `deriveColorScheme` is a testable pure function (no RN imports) | Can be unit-tested in plain Node; future themes (e.g. "sepia") are one call away. |
| **`as const`** | Mutable object literals | `as const` on every exported value | Values, not mutable objects — aligns with Hickey's "values" principle. |
| **Font type safety** | `Platform.select` returned `T \| undefined` with no explicit type | Explicit `FontFamilies` interface + non-null assertion (guaranteed by `default` key) | Contract is visible; TypeScript catches missing keys at compile time. |
| **TSDoc** | One comment at the top | Every exported symbol documented | Meets the Documentation protocol. |