

```tsx
// apps/mobile/components/CreatePostModal.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocialFeed } from '../hooks/useSocialFeed';
import { PostVisibility } from '../types/social';

// ─────────────────────────────────────────────────────────────────────────────
// PURE LOGIC — De-complected from UI. Testable with plain Node.js, no mocks.
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical verse-reference pattern: BOOK.CHAPTER.VERSE (e.g. JHN.3.16, GEN.1.1) */
const VERSE_REF_PATTERN = /^[A-Z1-3]{2,5}\.\d{1,3}\.\d{1,3}$/;

/** Maximum character length for post content. */
const MAX_CONTENT_LENGTH = 2000;

/** All supported visibility options, ordered for display. */
export const VISIBILITY_OPTIONS: readonly PostVisibility[] = [
  'public',
  'friends',
  'private',
] as const;

/**
 * Validation result for a new-post form.
 * `valid` is true only when the form is safe to submit.
 */
export interface PostValidationResult {
  readonly valid: boolean;
  readonly error: string | null;
}

/**
 * Validate the content and optional verse reference of a new post.
 *
 * @param content  - Raw text content from the user.
 * @param verseRef - Optional verse reference string (e.g. "JHN.3.16").
 * @returns A {@link PostValidationResult} indicating validity and an error message if invalid.
 *
 * @example
 * ```ts
 * validateNewPost('', '');           // { valid: false, error: 'Content cannot be empty.' }
 * validateNewPost('Hello', 'bad');   // { valid: false, error: 'Verse reference must match ...' }
 * validateNewPost('Hello', '');      // { valid: true, error: null }
 * ```
 */
export function validateNewPost(
  content: string,
  verseRef: string,
): PostValidationResult {
  const trimmedContent = content.trim();

  if (trimmedContent.length === 0) {
    return { valid: false, error: 'Content cannot be empty.' };
  }

  if (trimmedContent.length > MAX_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `Content must be ${MAX_CONTENT_LENGTH} characters or fewer.`,
    };
  }

  const trimmedRef = verseRef.trim();
  if (trimmedRef.length > 0 && !VERSE_REF_PATTERN.test(trimmedRef)) {
    return {
      valid: false,
      error:
        'Verse reference must match the format BOOK.CHAPTER.VERSE (e.g. JHN.3.16).',
    };
  }

  return { valid: true, error: null };
}

/**
 * Capitalise the first letter of a string.
 *
 * @param s - The input string.
 * @returns The string with the first character upper-cased.
 */
export function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
}) => {
  const { createPost, isMfaRequired } = useSocialFeed();
  const [content, setContent] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState<PostVisibility>('public');

  /** Reset form to its initial blank state. */
  const resetForm = useCallback(() => {
    setContent('');
    setVerseRef('');
    setVisibility('public');
  }, []);

  const handleCreate = useCallback(async () => {
    // 1. Pure validation — no I/O, no side-effects.
    const validation = validateNewPost(content, verseRef);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.error ?? 'Invalid input.');
      return;
    }

    // 2. Orchestrate the side-effect (Service / Hook layer).
    setLoading(true);
    try {
      const result = await createPost({
        content: content.trim(),
        verse_ref: verseRef.trim(),
        visibility,
      });

      if (result) {
        resetForm();
        onClose();
      } else if (isMfaRequired) {
        Alert.alert(
          'Security Check',
          'Multi-Factor Authentication is required to post.',
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [content, verseRef, visibility, createPost, isMfaRequired, onClose, resetForm]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Reflection</Text>
          <TouchableOpacity onPress={handleCreate} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.postText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Content ── */}
        <TextInput
          style={styles.input}
          multiline
          placeholder="Share your thoughts..."
          value={content}
          onChangeText={setContent}
          maxLength={MAX_CONTENT_LENGTH}
          editable={!loading}
        />

        {/* ── Verse Reference ── */}
        <View style={styles.fieldContainer}>
          <Ionicons name="book-outline" size={20} color="#666" />
          <TextInput
            style={styles.fieldInput}
            placeholder="Verse Ref (e.g. JHN.3.16)"
            value={verseRef}
            onChangeText={setVerseRef}
            autoCapitalize="characters"
            editable={!loading}
          />
        </View>

        {/* ── Visibility Toggle ── */}
        <View style={styles.visibilityContainer}>
          <Text style={styles.label}>Visibility:</Text>
          <View style={styles.toggleRow}>
            {VISIBILITY_OPTIONS.map((v) => (
              <TouchableOpacity
                key={v}
                style={[
                  styles.toggleBtn,
                  visibility === v && styles.toggleBtnActive,
                ]}
                onPress={() => setVisibility(v)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityState={{ selected: visibility === v }}
                accessibilityLabel={`Set visibility to ${v}`}
              >
                <Text
                  style={[
                    styles.toggleText,
                    visibility === v && styles.toggleTextActive,
                  ]}
                >
                  {capitalize(v)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  postText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  input: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  fieldInput: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
  },
  visibilityContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
  },
  toggleBtnActive: {
    backgroundColor: '#000',
  },
  toggleText: {
    color: '#000',
  },
  toggleTextActive: {
    color: '#fff',
  },
});
```

### What changed and why (Simplicity Audit → Plan → Execute)

| Concern | Before (Complected) | After (De-complected) |
|---|---|---|
| **Validation logic** | Inline `if (!content.trim())` inside the handler — untestable without rendering the component. | Extracted to **`validateNewPost()`**, a pure function at the top of the file. Testable in plain Node with zero mocks. |
| **Verse-ref validation** | None — any string was accepted, a potential injection vector if passed downstream. | **`VERSE_REF_PATTERN`** regex whitelist (`BOOK.CHAPTER.VERSE`). Invalid refs are rejected before the write path. |
| **Content length** | Unbounded — user could submit megabytes. | **`MAX_CONTENT_LENGTH`** constant enforced in both the pure validator and `<TextInput maxLength>`. |
| **Capitalize helper** | Inline `v.charAt(0).toUpperCase() + v.slice(1)` inside JSX. | Extracted to **`capitalize()`** — pure, exported, reusable. |
| **Visibility options** | Magic array literal `['public', 'friends', 'private']` in JSX. | **`VISIBILITY_OPTIONS`** const tuple — single source of truth, exported for tests. |
| **Error handling** | `createPost` rejection was swallowed; only MFA path surfaced. | `try/catch/finally` around the async call. Typed error message is displayed; `setLoading(false)` is guaranteed in `finally`. |
| **UX during loading** | Cancel button and inputs remained active while submitting. | All interactive elements receive **`disabled={loading}` / `editable={!loading}`**, preventing double-submit. |
| **Form reset** | Only `content` and `verseRef` were cleared on success; visibility kept stale state. | **`resetForm()`** callback clears all three fields. |
| **Re-render stability** | `handleCreate` was re-created every render with stale closures possible. | Wrapped in **`useCallback`** with explicit dependency array. |
| **Accessibility** | Toggle buttons had no semantic role. | Added **`accessibilityRole`**, **`accessibilityState`**, and **`accessibilityLabel`** to visibility toggles. |

> **ADR Note:** When `packages/social-engine` is available, `validateNewPost` and `capitalize` should migrate there so both `apps/mobile` and `apps/web` share the same validation contract. For now, they are exported from this file to comply with the single-file constraint.