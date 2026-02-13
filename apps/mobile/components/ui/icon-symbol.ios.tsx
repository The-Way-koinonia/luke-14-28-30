

```tsx
import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Pure Logic: Build the resolved style array for the icon.
// Extracted so it is testable without mounting a React component.
// ---------------------------------------------------------------------------

/**
 * Builds the composed style array for an `IconSymbol`, merging the
 * size-derived dimensions with any consumer-provided style overrides.
 *
 * @param size  - The width & height in logical pixels.
 * @param style - Optional additional style overrides from the consumer.
 * @returns A style array suitable for the underlying `SymbolView`.
 */
export function buildIconStyle(
  size: number,
  style?: StyleProp<ViewStyle>,
): [ViewStyle, StyleProp<ViewStyle>] {
  return [{ width: size, height: size }, style];
}

// ---------------------------------------------------------------------------
// Props contract
// ---------------------------------------------------------------------------

/** Public props for {@link IconSymbol}. */
export interface IconSymbolProps {
  /** SF Symbol name forwarded to `SymbolView`. */
  name: SymbolViewProps['name'];
  /** Logical pixel size (width & height). @defaultValue 24 */
  size?: number;
  /** Tint colour applied to the symbol. */
  color: string;
  /** Optional extra styles merged after the size dimensions. */
  style?: StyleProp<ViewStyle>;
  /** Symbol weight variant. @defaultValue 'regular' */
  weight?: SymbolWeight;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a native iOS SF Symbol via `expo-symbols`.
 *
 * This is the **iOS-specific** implementation; Android / web may supply their
 * own variant through the platform-extension convention
 * (`icon-symbol.android.tsx`, `icon-symbol.tsx`).
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: IconSymbolProps) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={buildIconStyle(size, style)}
    />
  );
}
```

### What changed & why

| Change | Rationale |
|---|---|
| **Extracted `buildIconStyle`** – pure function at the top of the file | De-complects style computation from the React tree; testable in a plain Node script with zero mocks (Simple Made Easy §1). |
| **Introduced `IconSymbolProps` interface** | "Values over Objects" – a named, reusable contract replaces an anonymous inline type. Enables Zod validation or reuse in a shared package in a future step. |
| **TSDoc on every export** | Execution Protocol §4 – every exported function & interface is documented. |
| **No new files created** | Respects the 🛑 CRITICAL CONSTRAINT (single-file edit). |