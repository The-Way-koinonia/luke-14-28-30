

```tsx
// apps/mobile/app/(tabs)/menu.tsx

import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------------
// Pure Logic / Constants (extractable to packages/ in a future step)
// ---------------------------------------------------------------------------

/** Gradient configuration for the menu header. */
export const MENU_HEADER_GRADIENT = {
  colors: [
    Colors.light.brand.gold.DEFAULT,
    Colors.light.brand.purple.DEFAULT,
  ] as const,
  start: { x: 0, y: 0 } as const,
  end: { x: 1, y: 1 } as const,
  height: 120,
} as const;

/** Derive the screen title – trivial now, but keeps UI declarative. */
export function getMenuScreenTitle(): string {
  return 'Menu';
}

/** Derive the placeholder subtitle. */
export function getMenuScreenSubtitle(): string {
  return 'Settings and additional options.';
}

// ---------------------------------------------------------------------------
// Styles (isolated from logic — pure aesthetic concern)
// ---------------------------------------------------------------------------

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
    height: MENU_HEADER_GRADIENT.height,
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
  subtitle: {
    fontSize: 16,
    color: '#333',
  },
});

// ---------------------------------------------------------------------------
// Component (thin orchestration layer — no logic, no data fetching)
// ---------------------------------------------------------------------------

/**
 * MenuScreen – top-level tab screen for settings & additional options.
 *
 * Rendering only; all derivable values come from pure helpers above so they
 * remain testable without mounting React Native.
 */
export default function MenuScreen() {
  const title = getMenuScreenTitle();
  const subtitle = getMenuScreenSubtitle();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...MENU_HEADER_GRADIENT.colors]}
        start={MENU_HEADER_GRADIENT.start}
        end={MENU_HEADER_GRADIENT.end}
        style={styles.headerBackground}
      />

      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.content}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
```

### What changed & why

| Concern | Before | After | Simplicity Rationale |
|---|---|---|---|
| **Magic strings in JSX** | `"Menu"`, `"Settings and…"` inlined in markup | Extracted to `getMenuScreenTitle()` / `getMenuScreenSubtitle()` pure functions | De-complects **copy/content** from **layout**. Testable in plain Node without React Native. |
| **Gradient config** | Colors, start/end vectors scattered inside JSX props | `MENU_HEADER_GRADIENT` const object (`as const` for immutability) | **Values over Objects** — a single, immutable data literal describes the gradient; the component just consumes it. |
| **Style readability** | Compressed one-liners | Expanded, one property per line; added `subtitle` style | Easier diffing, clearer intent. The subtitle `<Text>` now has a dedicated style instead of relying on defaults. |
| **TSDoc** | None | Added to every exported symbol | Meets the Documentation step of the Execution Protocol. |
| **Component body** | Directly returns JSX with embedded literals | Derives values, then renders — thin orchestration only | The component does **zero logic**; it reads values and paints pixels. |

> **Future ADR note:** When this screen gains real menu items or user-specific settings, the pure helpers should migrate to `packages/social-engine` or a new `packages/settings-engine`, and the data layer should flow through a proper Repository → Service → Component chain.