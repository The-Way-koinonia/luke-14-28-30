

```tsx
// apps/mobile/components/feed/VerseQuote.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Pure Logic (extracted at top of file per critical constraint)
// ---------------------------------------------------------------------------

/**
 * Formats raw verse text into a quoted display string.
 * Pure function: no side effects, no external dependencies.
 *
 * @param raw - The unformatted verse body text.
 * @returns The text wrapped in typographic quotation marks, trimmed.
 */
export function formatVerseText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return '';
  // Avoid double-wrapping if the text already has quotes
  if (trimmed.startsWith('\u201C') && trimmed.endsWith('\u201D')) return trimmed;
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return `\u201C${trimmed.slice(1, -1)}\u201D`;
  }
  return `\u201C${trimmed}\u201D`;
}

/**
 * Formats a scripture reference string for display with an em-dash prefix.
 * Pure function: no side effects, no external dependencies.
 *
 * @param reference - e.g. "John 3:16"
 * @returns Formatted string e.g. "— John 3:16"
 */
export function formatReference(reference: string): string {
  const trimmed = reference.trim();
  if (trimmed.length === 0) return '';
  return `\u2014 ${trimmed}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Props for {@link VerseQuote}. */
export interface VerseQuoteProps {
  /** Scripture reference, e.g. "John 3:16". */
  reference: string;
  /** Body text of the verse. */
  text: string;
}

/**
 * Renders a stylised block-quote for a single scripture verse.
 *
 * Formatting logic is delegated to the pure helpers
 * {@link formatVerseText} and {@link formatReference} so they can be
 * unit-tested without mounting a React tree.
 */
export default function VerseQuote({ reference, text }: VerseQuoteProps) {
  // Derive display values through pure functions — no entangled logic.
  const displayText = formatVerseText(text);
  const displayReference = formatReference(reference);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Verse quote: ${text}, ${reference}`}
    >
      <View style={styles.bar} />
      <View style={styles.content}>
        {displayText.length > 0 && (
          <Text style={styles.text}>{displayText}</Text>
        )}
        {displayReference.length > 0 && (
          <Text style={styles.reference}>{displayReference}</Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BAR_WIDTH = 4;
const BORDER_RADIUS = 8;
const CONTENT_PADDING = 12;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: Colors.light.brand.primary ?? '#6366f1',
  },
  content: {
    padding: CONTENT_PADDING,
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#374151',
    lineHeight: 24,
    marginBottom: 4,
  },
  reference: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    textAlign: 'right',
  },
});
```

### What changed and why

| Concern | Before | After | Simplicity Rationale |
|---|---|---|---|
| **Text formatting** | Inline string template `"{text}"` inside JSX — logic complected with UI. | Extracted to `formatVerseText()` pure function at the top of the file. | De-complects display logic from render tree; testable in plain Node.js without React. |
| **Reference formatting** | Inline `- ${reference}` in JSX. | Extracted to `formatReference()` — uses a proper em-dash (`—`). | Same de-complection benefit; also fixes typographic correctness. |
| **Null / empty safety** | No guard — renders empty quotes `""` and a lone dash `- ` for blank inputs. | Both helpers trim & guard; component conditionally renders `<Text>` only when content exists. | Eliminates visual artefacts without adding complexity to the component body. |
| **Accessibility** | None. | `accessible`, `accessibilityRole="text"`, and a descriptive `accessibilityLabel`. | Security/reliability protocol — inclusive by default. |
| **Magic numbers** | Raw `4`, `8`, `12` scattered in StyleSheet. | Named constants (`BAR_WIDTH`, `BORDER_RADIUS`, `CONTENT_PADDING`). | Values are self-documenting; single point of change. |
| **Nullish coalescing** | `Colors.light.brand.primary \|\| '#6366f1'` — falsy-catches `0` or `""`. | `??` — only catches `null`/`undefined`. | Correct semantic; avoids subtle bugs if the theme token is `0` or empty string. |
| **Double-quote idempotency** | Would double-wrap if `text` already contained quotes. | `formatVerseText` detects existing wrapping and normalises to typographic quotes. | Defensive, predictable output regardless of upstream data shape. |