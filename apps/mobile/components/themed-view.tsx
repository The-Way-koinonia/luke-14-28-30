The file is already well-structured and simple. It has minimal responsibility, no complected state/logic, and no security concerns. The only improvements to apply are:

1. **TSDoc** on the exported type and function.
2. **Extract the pure style-merging logic** into a small exported helper (per the constraint: at the top of the same file).
3. Minor readability polish.

Here is the refactored file:

```tsx
// apps/mobile/components/themed-view.tsx

import { type StyleProp, View, type ViewProps, type ViewStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

// ---------------------------------------------------------------------------
// Pure Logic (extracted – testable without React)
// ---------------------------------------------------------------------------

/**
 * Merges a resolved background color with an optional consumer-provided style.
 * Returns a deterministic, immutable style array suitable for RN's `style` prop.
 *
 * @param backgroundColor - The resolved theme-aware background color.
 * @param consumerStyle   - An optional style value forwarded by the consumer.
 * @returns A composable style array with the background color applied first
 *          so the consumer style can override it if desired.
 */
export function buildThemedViewStyle(
  backgroundColor: string,
  consumerStyle?: StyleProp<ViewStyle>,
): readonly [{ readonly backgroundColor: string }, StyleProp<ViewStyle>] {
  return [{ backgroundColor }, consumerStyle] as const;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Props accepted by {@link ThemedView}. */
export type ThemedViewProps = ViewProps & {
  /** Override the background color used in light mode. */
  lightColor?: string;
  /** Override the background color used in dark mode. */
  darkColor?: string;
};

/**
 * A theme-aware wrapper around React Native's `<View>`.
 *
 * Resolves the current theme's background color via `useThemeColor` and
 * applies it as the base style. Any additional `style` provided by the
 * consumer is merged on top, allowing selective overrides.
 *
 * @example
 * ```tsx
 * <ThemedView className="flex-1 p-4">
 *   <Text>Hello</Text>
 * </ThemedView>
 * ```
 */
export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background',
  );

  return (
    <View
      style={buildThemedViewStyle(backgroundColor, style)}
      {...otherProps}
    />
  );
}
```

### What changed and why

| Change | Rationale |
|---|---|
| Extracted `buildThemedViewStyle` as a **pure, exported function** at the top of the file. | De-complects style composition from the React render path. The function is testable in a plain Node script with zero mocking (Simple Made Easy §1). |
| Added **TSDoc** to every exported symbol (`ThemedViewProps`, `ThemedView`, `buildThemedViewStyle`). | Execution Protocol §4 — "Add TSDoc to every exported function." |
| Imported `StyleProp` and `ViewStyle` explicitly. | Gives the extracted helper a precise, typed contract (Values over Objects). |
| Returned a `readonly` tuple from the helper. | Favors immutable values over mutable arrays (§3). |
| No new files created. | Honors the 🛑 CRITICAL CONSTRAINT. |