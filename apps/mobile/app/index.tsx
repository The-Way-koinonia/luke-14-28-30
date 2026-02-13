

```tsx
// apps/mobile/app/index.tsx

import { View, Text } from "react-native";

// ---------------------------------------------------------------------------
// Pure Logic (to be extracted to packages/bible-engine in a future step)
// ---------------------------------------------------------------------------

/** Represents a single Bible verse reference. */
export interface VerseReference {
  readonly book: string;
  readonly chapter: number;
  readonly verse: number;
}

/** Represents a Bible verse with its reference and text content. */
export interface Verse {
  readonly reference: VerseReference;
  readonly text: string;
}

/**
 * Formats a `VerseReference` into a human-readable string.
 *
 * @param ref - The verse reference to format.
 * @returns A formatted string, e.g. "Genesis 1:1".
 *
 * @example
 * ```ts
 * formatReference({ book: "Genesis", chapter: 1, verse: 1 });
 * // => "Genesis 1:1"
 * ```
 */
export const formatReference = (ref: VerseReference): string =>
  `${ref.book} ${ref.chapter}:${ref.verse}`;

/**
 * Formats a complete `Verse` into a display string containing the reference
 * followed by the verse text.
 *
 * @param verse - The verse to format.
 * @returns A formatted string, e.g. "Genesis 1:1 In the beginning…".
 */
export const formatVerse = (verse: Verse): string =>
  `${formatReference(verse.reference)} ${verse.text}`;

// ---------------------------------------------------------------------------
// Data (static seed — will be replaced by a Repository call in a future step)
// ---------------------------------------------------------------------------

const SEED_VERSE: Verse = {
  reference: { book: "Genesis", chapter: 1, verse: 1 },
  text: "In the beginning God created the heaven and the earth.",
} as const;

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

/**
 * Root screen that displays a single Bible verse.
 *
 * Architecture notes:
 * - Display text is derived from a pure function (`formatVerse`), keeping
 *   rendering logic de-complected from data shaping.
 * - `SEED_VERSE` is a plain immutable value; it will be replaced by a
 *   Repository / Zustand store once offline-first data access is wired up.
 */
export default function HomeScreen(): JSX.Element {
  const displayText: string = formatVerse(SEED_VERSE);

  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      accessible
      accessibilityRole="summary"
    >
      <Text accessibilityLabel={displayText}>{displayText}</Text>
    </View>
  );
}
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **Logic ↔ UI complecting** | Verse text was a raw string literal baked into JSX. | Verse data is a typed immutable `Verse` value; display text is produced by the pure function `formatVerse`. Both are testable without any React runtime. |
| **Data shape** | None — just a string. | `Verse` and `VerseReference` interfaces provide a clear contract that a future Repository will satisfy. |
| **Naming** | `App` (generic). | `HomeScreen` — aligns with Expo Router file-based routing (`app/index.tsx` → root screen). |
| **Accessibility** | None. | `accessible`, `accessibilityRole`, and `accessibilityLabel` added. |
| **Documentation** | None. | TSDoc on every exported symbol per the Execution Protocol. |
| **Security / Validation** | N/A for this screen (no user input or DB calls yet). | Noted; Zod validation will be added when a Repository layer introduces external data. |

> **Next step (future ADR):** Extract `formatReference`, `formatVerse`, `Verse`, and `VerseReference` into `packages/bible-engine/src/verse.ts` and replace `SEED_VERSE` with a call to a mobile Repository backed by `expo-sqlite`.