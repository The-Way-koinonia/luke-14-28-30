

```tsx
// apps/mobile/app/(tabs)/memorize.tsx

/**
 * @fileoverview Memorize Tab Screen
 *
 * Pure logic is extracted to top-of-file functions (per single-file constraint).
 * UI is a thin shell that consumes values — no business logic in JSX.
 */

import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------------
// 1. PURE LOGIC — extracted, testable without React
// ---------------------------------------------------------------------------

/** Gradient stops for the header. Centralised so theming changes stay in one place. */
export function getHeaderGradient(): {
  colors: [string, string];
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  return {
    colors: [
      Colors.light.brand.gold.DEFAULT,
      Colors.light.brand.purple.DEFAULT,
    ],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  } as const;
}

/** Placeholder copy — will be replaced by memory-engine review queue data. */
export function getPlaceholderCopy(): { title: string; body: string } {
  return {
    title: 'Memorize',
    body: 'Scripture memorization tools coming soon.',
  };
}

// ---------------------------------------------------------------------------
// 2. UI SHELL — renders values only
// ---------------------------------------------------------------------------

export default function MemorizeScreen() {
  const gradient = getHeaderGradient();
  const copy = getPlaceholderCopy();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={styles.headerBackground}
      />
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>{copy.title}</Text>
        <View style={styles.content}>
          <Text style={styles.body}>{copy.body}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. STYLES — incidental presentation, kept separate from logic
// ---------------------------------------------------------------------------

const HEADER_HEIGHT = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    padding: 16,
  },
  content: {
    padding: 16,
  },
  body: {
    fontSize: 16,
    color: '#333',
  },
});
```

### What changed and why

| Concern | Before | After | Rationale |
|---|---|---|---|
| **Gradient config** | Inline in JSX — complected with render tree | `getHeaderGradient()` pure fn at top of file | De-complects theme values from UI; testable in plain Node |
| **Copy / placeholder text** | Hard-coded strings in JSX | `getPlaceholderCopy()` pure fn | Future hook-in point for `memory-engine` review queue; logic stays outside the component |
| **Magic numbers** | `height: 120` buried in StyleSheet | `HEADER_HEIGHT` named constant | Self-documenting; single change point |
| **Body text style** | Inherited default (unstyled `<Text>`) | Explicit `styles.body` | Prevents platform-inconsistent defaults; easier to theme |
| **TSDoc** | None | File-level + every exported function | Matches documentation protocol |
| **Exported helpers** | N/A | Both pure functions are `export`ed | Enables unit testing from a `__tests__` file without rendering React |

> **Next step (when multi-file refactoring is allowed):** Move `getHeaderGradient` into a shared `packages/ui-tokens` package, and replace `getPlaceholderCopy` with a call to `memory-engine`'s spaced-repetition review queue via a Repository → Service chain.