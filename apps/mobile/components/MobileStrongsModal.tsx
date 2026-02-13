

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StrongsDefinition } from '@the-way/bible-engine';
import { BibleService } from '@/services/BibleService';

// ---------------------------------------------------------------------------
// Pure Logic (extracted, testable without React)
// ---------------------------------------------------------------------------

/** Describes a displayable section within the Strongs modal body. */
export interface StrongsDisplaySection {
  readonly title: string;
  readonly content: string;
}

/**
 * Derives an ordered list of displayable sections from a `StrongsDefinition`.
 *
 * Pure function — no side-effects, no UI, no DB access.
 * Can be unit-tested with a plain Node.js runner.
 *
 * @param def - The strongs definition returned from the repository layer.
 * @returns An array of sections to render. Empty array if nothing is displayable.
 */
export function deriveDisplaySections(
  def: StrongsDefinition,
): readonly StrongsDisplaySection[] {
  const sections: StrongsDisplaySection[] = [];

  sections.push({
    title: 'Definition',
    content: def.definition || 'No definition available.',
  });

  if (def.original_word) {
    sections.push({ title: 'Original Word', content: def.original_word });
  }

  if (def.pronunciation) {
    sections.push({ title: 'Pronunciation', content: def.pronunciation });
  }

  return sections;
}

/** Discriminated-union state for async data fetching (Values > Objects). */
type DefinitionState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: StrongsDefinition }
  | { readonly status: 'error'; readonly message: string };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MobileStrongsModalProps {
  readonly strongsId: string | null;
  readonly word: string | null;
  readonly visible: boolean;
  readonly onClose: () => void;
}

/**
 * Bottom-sheet modal that displays a Strongs concordance definition.
 *
 * Architecture notes:
 * - UI state is modelled as a discriminated union (`DefinitionState`) so
 *   impossible states are unrepresentable (no separate `loading` + `data`
 *   booleans that can drift out of sync).
 * - All display-derivation logic lives in `deriveDisplaySections` — a pure
 *   function that can be tested independently of React Native.
 */
export default function MobileStrongsModal({
  strongsId,
  word,
  visible,
  onClose,
}: MobileStrongsModalProps) {
  const [state, setState] = useState<DefinitionState>({ status: 'idle' });

  const loadDefinition = useCallback(async (id: string) => {
    setState({ status: 'loading' });
    try {
      const data = await BibleService.getStrongsDefinition(id);
      if (data) {
        setState({ status: 'success', data });
      } else {
        setState({ status: 'error', message: 'Definition not found.' });
      }
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to load definition.';
      setState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    if (visible && strongsId) {
      loadDefinition(strongsId);
    } else {
      setState({ status: 'idle' });
    }
  }, [visible, strongsId, loadDefinition]);

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{word}</Text>
              <Text style={styles.subtitle}>{strongsId}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Body — driven by discriminated union */}
          {state.status === 'loading' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5b21b6" />
            </View>
          )}

          {state.status === 'success' && (
            <ScrollView style={styles.body}>
              {deriveDisplaySections(state.data).map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.text}>{section.content}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {state.status === 'error' && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{state.message}</Text>
            </View>
          )}

          {state.status === 'idle' && null}
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  body: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
});
```

### What changed & why

| Concern | Before (Complected) | After (Simple) |
|---|---|---|
| **State model** | Two independent `useState` booleans (`loading`, `definition`) — impossible states are representable (e.g. `loading=true` while `definition` is stale from a previous fetch). | Single **discriminated union** `DefinitionState` with `idle | loading | success | error`. Impossible states are eliminated at the type level. |
| **Display logic** | Conditional rendering decisions embedded directly in JSX (`definition.original_word && …`). | Extracted to **`deriveDisplaySections`** — a **pure function** that takes a `StrongsDefinition` and returns an array of `{title, content}` values. Testable with `node --test` and zero React/RN mocking. |
| **Error handling** | `catch (e) { console.error(...) }` — error silently swallowed; user sees "Definition not found" for both "no result" and "network failure." | Typed error is captured into `state.status === 'error'` with a descriptive `message`. `null` data from the service yields a distinct "not found" error. |
| **Effect deps** | `loadDefinition` was re-created every render and missing from the `useEffect` dep array (React lint warning). | `loadDefinition` wrapped in `useCallback`; listed in `useEffect` deps. |
| **Accessibility** | Close button had no accessible label. | Added `accessibilityLabel` and `accessibilityRole`. |
| **Readonly props** | Props interface used mutable fields. | All interface fields marked `readonly` (values > mutable objects). |

> **Future move (next step):** `deriveDisplaySections` and `StrongsDisplaySection` are prime candidates for migration to `packages/bible-engine` — they are already pure and dependency-free.