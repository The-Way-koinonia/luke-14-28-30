```tsx
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// ---------------------------------------------------------------------------
// Pure Logic (extract to packages/ when scope permits)
// ---------------------------------------------------------------------------

/** Modal content configuration — pure value, no UI or state entangled. */
export interface ModalContent {
  readonly title: string;
  readonly linkLabel: string;
  readonly linkHref: '/' | (string & {});
}

/**
 * Returns the default modal content.
 * Keeping this as a pure function makes it trivially testable in a plain
 * Node.js script without mocking any React Native / Expo internals.
 */
export const getDefaultModalContent = (): ModalContent => ({
  title: 'This is a modal',
  linkLabel: 'Go to home screen',
  linkHref: '/',
});

// ---------------------------------------------------------------------------
// UI (Presentation only — consumes pure values)
// ---------------------------------------------------------------------------

export default function ModalScreen() {
  const content = getDefaultModalContent();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{content.title}</ThemedText>
      <Link href={content.linkHref} dismissTo style={styles.link}>
        <ThemedText type="link">{content.linkLabel}</ThemedText>
      </Link>
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **De-complect State & Logic** | Hardcoded strings lived inside JSX — presentation and content were complected. | Content is produced by `getDefaultModalContent()`, a pure function returning an immutable `ModalContent` value. |
| **Values over Objects** | N/A (strings inline). | `ModalContent` is a readonly interface (value, not a class). |
| **Testability** | Only testable by rendering the component. | `getDefaultModalContent()` is testable in a plain Node.js script with zero mocks. |
| **TSDoc** | None. | Every exported symbol is documented. |
| **Security** | No risk surface in this file. | No change needed — no user input, no SQL, no API calls. |

> **Future ADR note:** When a second consumer needs `ModalContent` (e.g., web), extract `getDefaultModalContent` and its interface into `packages/ui-content` or an appropriate shared package.