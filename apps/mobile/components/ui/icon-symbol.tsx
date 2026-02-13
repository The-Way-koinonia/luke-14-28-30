

```tsx
// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Pure Types & Data
// ---------------------------------------------------------------------------

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type IconMapping = Record<string, MaterialIconName>;

/**
 * Mapping from SF Symbol names to Material Icon names.
 *
 * @remarks
 * - Material Icons: {@link https://icons.expo.fyi}
 * - SF Symbols: {@link https://developer.apple.com/sf-symbols/}
 *
 * Add new entries here when a screen needs an additional icon.
 * The mapping is declared `as const` so that `IconSymbolName` is a
 * narrow union, giving callers compile-time safety.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'person.fill': 'person',
  'gearshape.fill': 'settings',
  'bubble.left.and.bubble.right.fill': 'forum',
  'book.fill': 'menu-book',
  'person.2.fill': 'group',
  'brain.head.profile': 'psychology',
  'line.3.horizontal': 'menu',
} as const satisfies IconMapping;

/** Union of all supported SF Symbol names. */
export type IconSymbolName = keyof typeof MAPPING;

// ---------------------------------------------------------------------------
// Pure Logic (de-complected from UI)
// ---------------------------------------------------------------------------

/**
 * Resolves an SF Symbol name to its Material Icon counterpart.
 *
 * @param sfName - An SF Symbol identifier present in `MAPPING`.
 * @returns The corresponding Material Icon name.
 * @throws {Error} If `sfName` is not found in the mapping (developer error).
 *
 * @example
 * ```ts
 * resolveIconName('house.fill'); // 'home'
 * ```
 */
export function resolveIconName(sfName: IconSymbolName): MaterialIconName {
  const resolved = (MAPPING as IconMapping)[sfName];
  if (!resolved) {
    throw new Error(
      `[IconSymbol] No Material Icon mapping found for SF Symbol "${sfName}". ` +
        'Add an entry to the MAPPING object in icon-symbol.tsx.',
    );
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props accepted by {@link IconSymbol}. */
export interface IconSymbolProps {
  /** SF Symbol name (must exist in the internal mapping). */
  name: IconSymbolName;
  /** Icon size in logical pixels. @defaultValue 24 */
  size?: number;
  /** Icon colour – accepts themed or opaque values. */
  color: string | OpaqueColorValue;
  /** Optional text-style override forwarded to the underlying glyph. */
  style?: StyleProp<TextStyle>;
  /** SF Symbol weight hint (used on iOS; ignored here). */
  weight?: SymbolWeight;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Cross-platform icon component.
 *
 * Uses native SF Symbols on iOS (via the `.ios.tsx` variant) and
 * Material Icons on Android / web (this file).
 *
 * Icon `name` values are SF Symbol identifiers; they are resolved to
 * Material Icon names via {@link resolveIconName}.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: IconSymbolProps) {
  return (
    <MaterialIcons
      name={resolveIconName(name)}
      size={size}
      color={color}
      style={style}
    />
  );
}
```

### What changed and why

| Concern | Before | After | Rationale |
|---|---|---|---|
| **Logic / UI separation** | Mapping lookup was inlined in JSX (`MAPPING[name]`) | Extracted to `resolveIconName()` — a pure, exported function at the top of the file | De-complects icon resolution from rendering; testable in a plain Node script without React. |
| **Runtime safety** | Silent `undefined` if a name was missing from the mapping | `resolveIconName` throws a typed `Error` with an actionable message | Fail-fast on developer mistakes instead of rendering an invisible icon. |
| **Type narrowing** | `as IconMapping` widened the mapping to `Record<string, …>` | `as const satisfies IconMapping` preserves a narrow literal union **and** validates structure | `IconSymbolName` is now a true compile-time union; typos are caught by TypeScript. |
| **Exported types** | `IconSymbolName` was local; props were inline | Both `IconSymbolName` and `IconSymbolProps` are exported interfaces | Consumers (screens, tests) can import and reuse the types without reaching into internals. |
| **Documentation** | Single JSDoc block | TSDoc on every export (`resolveIconName`, `IconSymbolProps`, `IconSymbol`, `MAPPING`) | Meets the Execution Protocol § Document requirement. |