

```tsx
// apps/mobile/app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ---------------------------------------------------------------------------
// Pure Logic: Tab Configuration (de-complected from JSX rendering)
// ---------------------------------------------------------------------------

/** SF Symbol name used by IconSymbol. */
type SFSymbol = React.ComponentProps<typeof IconSymbol>['name'];

/** Declarative descriptor for a single tab screen. */
interface TabDescriptor {
  /** Route name – must match the file under (tabs)/ */
  readonly name: string;
  /** Human-readable title shown in the tab bar. */
  readonly title: string;
  /** SF Symbol identifier for the tab icon. */
  readonly icon: SFSymbol;
  /** Icon render size in dp. */
  readonly iconSize: number;
}

/** Descriptor for a screen that exists under (tabs)/ but is hidden from the bar. */
interface HiddenTabDescriptor {
  readonly name: string;
}

/**
 * Visible tabs shown in the bottom navigation bar.
 *
 * Order here determines render order.
 * This is a pure value – no UI or state dependency.
 */
export const VISIBLE_TABS: readonly TabDescriptor[] = [
  { name: 'index', title: 'Home', icon: 'house.fill', iconSize: 28 },
  { name: 'read', title: 'Read', icon: 'book.fill', iconSize: 28 },
  { name: 'feed', title: 'Social', icon: 'person.2.fill', iconSize: 28 },
  { name: 'memorize', title: 'Memorize', icon: 'brain.head.profile', iconSize: 28 },
  { name: 'menu', title: 'Menu', icon: 'line.3.horizontal', iconSize: 28 },
] as const;

/**
 * Screens that live under the (tabs) directory but should NOT appear
 * in the tab bar. They are navigated to programmatically from other screens.
 */
export const HIDDEN_TABS: readonly HiddenTabDescriptor[] = [
  { name: 'explore' },
  { name: 'profile' },
  { name: 'settings' },
] as const;

/**
 * Resolve the active tint colour for the current colour scheme.
 *
 * Pure function – easily testable without mounting any component.
 */
export function resolveActiveTint(scheme: 'light' | 'dark' | null | undefined): string {
  return Colors[scheme ?? 'light'].tint;
}

// ---------------------------------------------------------------------------
// Component: Tab Layout (thin UI shell – orchestration only)
// ---------------------------------------------------------------------------

/**
 * Root tab layout for the app.
 *
 * All tab metadata is driven by the `VISIBLE_TABS` / `HIDDEN_TABS` values
 * above so that the JSX tree contains zero business knowledge.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeTint = resolveActiveTint(colorScheme);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {VISIBLE_TABS.map(({ name, title, icon, iconSize }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }: { color: string }) => (
              <IconSymbol size={iconSize} name={icon} color={color} />
            ),
          }}
        />
      ))}

      {HIDDEN_TABS.map(({ name }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: null }}
        />
      ))}
    </Tabs>
  );
}
```

### What changed and why

| Concern | Before | After |
|---|---|---|
| **State ↔ Logic complecting** | Colour-scheme resolution inlined in JSX prop | Extracted to `resolveActiveTint()` – pure, testable without React |
| **Tab definitions** | Duplicated JSX blocks with magic strings | Data-driven via `VISIBLE_TABS` / `HIDDEN_TABS` immutable value arrays |
| **Extensibility** | Adding a tab means copy-pasting another `<Tabs.Screen>` block | Add one object to the array; JSX is generated via `.map()` |
| **Testability** | Nothing exportable to unit-test | `resolveActiveTint`, `VISIBLE_TABS`, `HIDDEN_TABS` all exported and testable in plain Node |
| **Simple vs Easy** | Easy (familiar copy-paste), but entangled (icon names, titles, visibility logic woven into JSX) | Simple (tab metadata is a plain value; rendering is a thin loop) |

> **ADR Note:** When `packages/navigation-engine` (or similar) is introduced, `VISIBLE_TABS`, `HIDDEN_TABS`, and `resolveActiveTint` should migrate there. For now they live at file-top per the single-file constraint.