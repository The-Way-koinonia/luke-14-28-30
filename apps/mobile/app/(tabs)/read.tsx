

```tsx
// apps/mobile/app/(tabs)/read.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BibleService } from '@/services/BibleService';
import { BibleBook, BibleVerse } from '@the-way/bible-engine';
import MobileStrongsModal from '@/components/MobileStrongsModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// PURE LOGIC — Extracted functions (no side-effects, no React, no I/O)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Represents a single parsed token from OSIS/WLC-style `<w>` XML markup.
 * Either a plain text fragment or a word with optional Strong's reference.
 */
export interface ParsedToken {
  /** The visible text content */
  text: string;
  /** Strong's ID (e.g. "G3004") if the token originated from a `<w>` element */
  strongsId?: string;
  /** Whether this token is a tappable Strong's word */
  isStrongsWord: boolean;
}

/** Regex to split verse XML into `<w …>…</w>` groups and plain-text spans */
const WORD_ELEMENT_RE = /(<w[^>]*>.*?<\/w>)/g;

/** Regex to extract the first `strong:G1234` or `strong:H5678` reference */
const STRONGS_REF_RE = /strong:([GH]\d+)/;

/** Regex to strip all XML tags from a string */
const STRIP_TAGS_RE = /<[^>]+>/g;

/**
 * Parses raw OSIS-style verse XML into an ordered list of `ParsedToken`s.
 *
 * @param rawXml - The XML text of a single verse (may contain `<w>` elements).
 * @returns An array of tokens ready for rendering.
 *
 * @example
 * ```ts
 * parseVerseXml('<w strong:G3588>The</w> beginning');
 * // => [
 * //   { text: 'The', strongsId: 'G3588', isStrongsWord: true },
 * //   { text: ' beginning', isStrongsWord: false },
 * // ]
 * ```
 */
export function parseVerseXml(rawXml: string): ParsedToken[] {
  const parts = rawXml.split(WORD_ELEMENT_RE);

  return parts
    .map((part): ParsedToken | null => {
      if (!part) return null;

      if (part.startsWith('<w')) {
        const text = part.replace(STRIP_TAGS_RE, '');
        const match = STRONGS_REF_RE.exec(part);
        return {
          text,
          strongsId: match ? match[1] : undefined,
          isStrongsWord: true,
        };
      }

      const text = part.replace(STRIP_TAGS_RE, '');
      if (!text) return null;

      return { text, isStrongsWord: false };
    })
    .filter((t): t is ParsedToken => t !== null);
}

/**
 * Look up the display name for a book by its numeric ID.
 *
 * @param books - The full list of available Bible books.
 * @param bookId - The numeric book ID to find.
 * @returns The book name, or `'Loading…'` if not yet available.
 */
export function resolveBookName(books: BibleBook[], bookId: number): string {
  return books.find((b) => b.id === bookId)?.name ?? 'Loading…';
}

/**
 * Clamp a chapter number to a minimum of 1.
 * (Upper-bound clamping requires knowing chapter count — handled at call site.)
 */
export function clampChapter(chapter: number): number {
  return Math.max(1, chapter);
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION — Zod schemas for data crossing trust boundaries
// ─────────────────────────────────────────────────────────────────────────────

const HighlightSchema = z.object({
  verseId: z.number(),
  color: z.enum(['yellow', 'green', 'blue', 'pink', 'orange']),
});

const HighlightsArraySchema = z.array(HighlightSchema);

export type Highlight = z.infer<typeof HighlightSchema>;

/**
 * Safely parse a raw JSON string into a validated array of `Highlight`s.
 * Returns an empty array on any parse or validation failure.
 */
export function parseHighlightsJson(raw: string | null): Highlight[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = HighlightsArraySchema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function MobileBibleReader() {
  const router = useRouter();

  // ── Data State ──
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<number>(43); // John
  const [selectedChapter, setSelectedChapter] = useState<number>(3);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  // ── Modal State ──
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStrongsId, setSelectedStrongsId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // ── Side-Effects (Repository Layer — thin wrappers over I/O) ──

  useEffect(() => {
    const init = async () => {
      try {
        const [data, raw] = await Promise.all([
          BibleService.getBooks(),
          AsyncStorage.getItem('bible-highlights'),
        ]);
        setBooks(data);
        setHighlights(parseHighlightsJson(raw));
      } catch (e) {
        console.error('[read] Failed initial load', e);
      }
    };
    init();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchVerses = async () => {
      setLoading(true);
      try {
        const data = await BibleService.getChapter(selectedBook, selectedChapter);
        if (!cancelled) setVerses(data);
      } catch (e) {
        console.error('[read] Failed to load verses', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVerses();
    return () => {
      cancelled = true;
    };
  }, [selectedBook, selectedChapter]);

  // ── Event Handlers ──

  const handleWordPress = useCallback(
    (word: string, strongsId: string | undefined) => {
      if (!strongsId) return;
      setSelectedWord(word);
      setSelectedStrongsId(strongsId);
      setModalVisible(true);
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handlePrevChapter = useCallback(() => {
    setSelectedChapter((c) => clampChapter(c - 1));
  }, []);

  const handleNextChapter = useCallback(() => {
    setSelectedChapter((c) => c + 1);
  }, []);

  // ── Render Helpers ──

  /**
   * Render a single verse's XML as a row of `<Text>` elements,
   * delegating parsing to the pure `parseVerseXml` function.
   */
  const renderVerseText = (verse: BibleVerse) => {
    const tokens = parseVerseXml(verse.text);

    return (
      <Text style={styles.verseText}>
        {tokens.map((token, idx) => {
          const key = `${verse.id}-t-${idx}`;

          if (token.isStrongsWord) {
            return (
              <Text
                key={key}
                style={styles.clickableWord}
                onPress={() => handleWordPress(token.text, token.strongsId)}
              >
                {token.text}
              </Text>
            );
          }

          return <Text key={key}>{token.text}</Text>;
        })}
      </Text>
    );
  };

  // ── Derived Values (pure computation, no state mutation) ──
  const headerBookName = resolveBookName(books, selectedBook);

  // ── JSX ──

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[
          Colors.light.brand.gold.DEFAULT,
          Colors.light.brand.purple.DEFAULT,
          Colors.light.brand.purple.dark,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => {/* TODO: open book picker */}}>
          <Text style={styles.headerTitle}>
            {headerBookName} {selectedChapter}
          </Text>
          <Text style={styles.headerSubtitle}>King James Version</Text>
        </TouchableOpacity>

        <View style={styles.headerControls}>
          <TouchableOpacity onPress={handlePrevChapter}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextChapter}>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#d4a017" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {verses.map((verse, index) => (
            <View key={verse.id ?? index} style={styles.verseRow}>
              <Text style={styles.verseNumber}>{verse.verse}</Text>
              {renderVerseText(verse)}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Strong's Modal */}
      <MobileStrongsModal
        visible={modalVisible}
        word={selectedWord}
        strongsId={selectedStrongsId}
        onClose={handleCloseModal}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 2,
  },
  headerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  loader: {
    marginTop: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontSize: 12,
    color: '#6b7280',
    width: 24,
    paddingTop: 4,
    fontWeight: 'bold',
  },
  verseText: {
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 32,
    flex: 1,
  },
  clickableWord: {
    color: '#5b21b6',
  },
});
```

---

### What changed and why

| Concern | Before (Complected) | After (Simple) |
|---|---|---|
| **XML parsing** | Inline regex logic inside `renderVerseText` — tangled with React `<Text>` creation | Extracted to **`parseVerseXml()`** — a pure function (string → `ParsedToken[]`) testable in plain Node without React |
| **Highlight deserialization** | Raw `JSON.parse` with no validation (`setHighlights(JSON.parse(saved))`) — injection / crash risk | **`parseHighlightsJson()`** validates through a **Zod schema** (`HighlightsArraySchema`); returns `[]` on any failure |
| **Book name lookup** | `books.find(b => b.id === selectedBook)?.name \|\| 'Loading...'` inlined in JSX | **`resolveBookName()`** — pure, testable, reusable |
| **Chapter clamping** | Anonymous arrow `c => Math.max(1, c - 1)` duplicated inline | **`clampChapter()`** — named, testable, intention-revealing |
| **Stale closure / race condition** | `loadVerses` had no cancellation; fast chapter-tapping could set stale state | Added `cancelled` flag in the `useEffect` cleanup |
| **Initial data load** | Two separate `useEffect` bodies firing on mount; highlights load had no error handling | Single `Promise.all` for parallel I/O, wrapped in try/catch |
| **Callback identity** | Inline arrow functions re-created every render, triggering unnecessary child re-renders | `useCallback` for `handleWordPress`, `handleCloseModal`, `handlePrevChapter`, `handleNextChapter` |
| **`handleWordClick` signature** | Accepted full `BibleVerse` object (unused) — unnecessary coupling | Simplified to `handleWordPress(word, strongsId)` — only what's needed |
| **Type safety** | `Highlight` was a bare `interface` — no runtime guarantee | `Highlight` is now `z.infer<typeof HighlightSchema>` — single source of truth |
| **Security (OWASP)** | `JSON.parse` of untrusted AsyncStorage content with no schema check | Zod validation rejects malformed / injected data |