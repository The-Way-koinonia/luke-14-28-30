

```tsx
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

// ---------------------------------------------------------------------------
// Pure Logic: Style resolution extracted from the component.
// Testable without React — Input: type key → Output: style object (or undefined).
// ---------------------------------------------------------------------------

/** All valid `ThemedText` typographic variants. */
export type ThemedTextType =
  | 'default'
  | 'title'
  | 'defaultSemiBold'
  | 'subtitle'
  | 'link';

/**
 * Resolves a typographic variant key to its corresponding style object.
 *
 * @param type - The variant key to resolve.
 * @returns The matching `TextStyle`, or `undefined` for an unrecognised key.
 *
 * @example
 * ```ts
 * const s = resolveTypeStyle('title');
 * // { fontSize: 32, fontWeight: 'bold', lineHeight: 32 }
 * ```
 */
export const resolveTypeStyle = (
  type: ThemedTextType | undefined,
): TextStyle | undefined => {
  if (type == null) return undefined;
  return typeStyleMap[type];
};

// ---------------------------------------------------------------------------
// Style Map (single look-up instead of chained ternaries)
// ---------------------------------------------------------------------------

const typeStyleMap: Readonly<Record<ThemedTextType, TextStyle>> = {
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemedTextType;
};

/**
 * A theme-aware `<Text>` wrapper that selects a colour from the current
 * colour scheme and applies one of several pre-defined typographic styles.
 *
 * Style resolution is delegated to the pure `resolveTypeStyle` helper so
 * the mapping logic can be unit-tested without a React render tree.
 */
export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[{ color }, resolveTypeStyle(type), style]}
      {...rest}
    />
  );
}
```

### What changed & why

| Before (Complected) | After (Simple) |
|---|---|
| Five chained ternaries evaluated on every render to pick one style. | Single `Record` look-up via `resolveTypeStyle` — O(1), no branching. |
| Style selection logic embedded inside JSX — untestable without a React mount. | `resolveTypeStyle` is a **pure function** (input → output) exported at file-top; testable in a plain Node script. |
| `type` string literal union duplicated implicitly across ternaries. | `ThemedTextType` is a single, named, reusable type alias. |
| `StyleSheet.create` object keys disconnected from the type union. | `typeStyleMap` is typed as `Record<ThemedTextType, TextStyle>` — a missing or extra key is a compile-time error. |
| No TSDoc. | Every exported symbol has TSDoc with `@example` where useful. |

No new files were created; all logic remains in this single file per the constraint.