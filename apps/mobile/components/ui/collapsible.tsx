

```tsx
// apps/mobile/components/ui/collapsible.tsx

import { PropsWithChildren, useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ---------------------------------------------------------------------------
// Pure Logic (de-complected from UI)
// ---------------------------------------------------------------------------

/**
 * Resolve the icon color for a given color scheme.
 * Pure function – no React or platform dependencies.
 */
export const resolveIconColor = (
  scheme: 'light' | 'dark',
): string => (scheme === 'light' ? Colors.light.icon : Colors.dark.icon);

/**
 * Derive the chevron rotation transform style for the open/closed state.
 * Pure function – returns a plain style-compatible value.
 */
export const chevronRotation = (
  isOpen: boolean,
): { transform: { rotate: string }[] } => ({
  transform: [{ rotate: isOpen ? '90deg' : '0deg' }],
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for {@link Collapsible}. */
export interface CollapsibleProps extends PropsWithChildren {
  /** Section heading rendered next to the chevron. */
  title: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * An accessible, disclosure-style collapsible section.
 *
 * State is minimal (open / closed); all derived values are computed
 * via the pure helpers above so they remain independently testable.
 */
export function Collapsible({ children, title }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scheme: 'light' | 'dark' = useColorScheme() ?? 'light';

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={toggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${title}, ${isOpen ? 'expanded' : 'collapsed'}`}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={resolveIconColor(scheme)}
          style={chevronRotation(isOpen)}
        />
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>

      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles (incidental presentation – kept co-located for single-file constraint)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **Logic × UI entanglement** | Color resolution & rotation derived inline inside JSX | Extracted to **`resolveIconColor`** and **`chevronRotation`** – pure, exported, testable in a plain Node script with zero mocks. |
| **Props contract** | Inline intersection type `PropsWithChildren & { title: string }` | Named **`CollapsibleProps`** interface with TSDoc – clearer contract, discoverable via IDE. |
| **Accessibility** | None | `accessibilityRole="button"`, `accessibilityState.expanded`, and a descriptive `accessibilityLabel` added. |
| **Re-render cost** | Anonymous arrow re-created every render for `onPress` | Stable **`useCallback`** reference for `toggle`. |
| **Type safety** | `theme` could technically be `null` at usage sites | Narrowed to `'light' | 'dark'` immediately after hook call. |
| **Documentation** | None | TSDoc on every exported symbol per Execution Protocol. |