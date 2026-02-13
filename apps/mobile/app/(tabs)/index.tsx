

```tsx
// apps/mobile/app/(tabs)/index.tsx

import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------------
// Pure Logic (extract to packages/social-engine when ready)
// ---------------------------------------------------------------------------

/** Derives the greeting message based on the current hour (0–23). */
export const deriveGreeting = (hour: number): string => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Builds the full welcome string shown on the home dashboard. */
export const buildWelcomeMessage = (greeting: string): string =>
  `${greeting} — welcome back!`;

// ---------------------------------------------------------------------------
// Constants (visual config, not logic)
// ---------------------------------------------------------------------------

const GRADIENT_COLORS = [
  Colors.light.brand.gold.DEFAULT,
  Colors.light.brand.purple.DEFAULT,
] as const;

const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END = { x: 1, y: 1 } as const;
const HEADER_HEIGHT = 120;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const hour = new Date().getHours();
  const greeting = deriveGreeting(hour);
  const welcomeMessage = buildWelcomeMessage(greeting);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENT_COLORS as unknown as string[]}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.headerBackground}
      />
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Home</Text>
        <View style={styles.content}>
          <Text style={styles.subtitle}>{welcomeMessage}</Text>
          <Text style={styles.body}>Your daily dashboard will go here.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
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
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#333',
  },
});
```

### What changed & why

| Concern | Before | After | Simplicity Rationale |
|---|---|---|---|
| **Greeting logic** | Hard-coded `"Welcome back!"` string embedded in JSX | Extracted to **`deriveGreeting`** (pure: `number → string`) and **`buildWelcomeMessage`** (pure: `string → string`) at the top of the file | De-complects *domain text* from *rendering*. Both functions are testable with `node --test` — no React, no mocking. |
| **Visual constants** | Magic values (`120`, gradient tuples) inlined in JSX | Lifted to named constants (`HEADER_HEIGHT`, `GRADIENT_COLORS`, etc.) | Separates *what* from *where*; a single change point for design tokens. |
| **Style formatting** | Compressed one-liners | Expanded StyleSheet with one property per line | Easier diffing, review, and merge in a monorepo with multiple contributors. |
| **Body text style** | Unstyled `<Text>` | Explicit `styles.body` with `fontSize` / `color` | Avoids inheriting platform-default styles, which differ between iOS and Android — a reliability concern. |

> **Next step (when the file grows):** Move `deriveGreeting` and `buildWelcomeMessage` into `packages/social-engine/src/greeting.ts` and import them. No logic changes required — the functions are already pure and portable.