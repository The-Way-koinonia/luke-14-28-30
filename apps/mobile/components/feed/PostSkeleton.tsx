

```tsx
// apps/mobile/components/feed/PostSkeleton.tsx

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

// ---------------------------------------------------------------------------
// Pure Logic: Skeleton animation configuration
// Extracted as a pure function so animation parameters are testable and
// de-complected from the React lifecycle.
// ---------------------------------------------------------------------------

/** Describes a single step in a pulse animation sequence. */
interface PulseStep {
  readonly toValue: number;
  readonly duration: number;
}

/**
 * Returns the pulse animation sequence configuration.
 * Pure function — no side-effects, no Animated API dependency.
 *
 * @param minOpacity - The lowest opacity in the pulse cycle.
 * @param maxOpacity - The highest opacity in the pulse cycle.
 * @param stepDuration - Duration (ms) of each half-cycle.
 * @returns A readonly tuple of two PulseStep values.
 */
export function buildPulseSequence(
  minOpacity: number = 0.3,
  maxOpacity: number = 0.7,
  stepDuration: number = 800,
): readonly [PulseStep, PulseStep] {
  return [
    { toValue: maxOpacity, duration: stepDuration },
    { toValue: minOpacity, duration: stepDuration },
  ] as const;
}

// ---------------------------------------------------------------------------
// Pure Logic: Skeleton shape descriptors
// Keeps layout intent readable and separated from StyleSheet mechanics.
// ---------------------------------------------------------------------------

/** Describes a single content-line placeholder in the skeleton. */
interface SkeletonLine {
  readonly widthPercent: string;
  readonly key: string;
}

/**
 * Returns the set of content placeholder lines for a post skeleton.
 * Pure data — no UI coupling.
 */
export function buildContentLines(): readonly SkeletonLine[] {
  return [
    { widthPercent: '90%', key: 'line-1' },
    { widthPercent: '80%', key: 'line-2' },
    { widthPercent: '60%', key: 'line-3' },
  ] as const;
}

/** Number of action placeholders (like, comment, share). */
export const ACTION_PLACEHOLDER_COUNT = 3 as const;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Drives a looping pulse animation on a given Animated.Value.
 * Encapsulates all imperative Animated API usage in one place.
 */
function usePulseAnimation(
  animatedValue: Animated.Value,
  sequence: readonly PulseStep[],
): void {
  useEffect(() => {
    const steps = sequence.map((step) =>
      Animated.timing(animatedValue, {
        toValue: step.toValue,
        duration: step.duration,
        useNativeDriver: true,
      }),
    );

    const loop = Animated.loop(Animated.sequence(steps));
    loop.start();

    return () => {
      loop.stop();
    };
  }, [animatedValue, sequence]);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const INITIAL_OPACITY = 0.3;
const SKELETON_BG = '#e5e7eb' as const;
const AVATAR_SIZE = 40 as const;
const CONTENT_LEFT_INSET = AVATAR_SIZE + 12; // avatar width + marginRight

/**
 * A shimmer/pulse skeleton placeholder for a single feed post.
 * Renders while real post data is loading.
 */
export default function PostSkeleton(): React.JSX.Element {
  const opacity = useRef(new Animated.Value(INITIAL_OPACITY)).current;
  const pulseSequence = useRef(buildPulseSequence()).current;
  const contentLines = useRef(buildContentLines()).current;

  usePulseAnimation(opacity, pulseSequence);

  return (
    <View style={styles.container}>
      {/* Header: avatar + name / handle */}
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { opacity }]} />
        <View style={styles.headerText}>
          <Animated.View style={[styles.name, { opacity }]} />
          <Animated.View style={[styles.handle, { opacity }]} />
        </View>
      </View>

      {/* Content lines */}
      <View style={styles.content}>
        {contentLines.map((line) => (
          <Animated.View
            key={line.key}
            style={[styles.line, { width: line.widthPercent, opacity }]}
          />
        ))}
      </View>

      {/* Action icons */}
      <View style={styles.actions}>
        {Array.from({ length: ACTION_PLACEHOLDER_COUNT }, (_, i) => (
          <Animated.View key={`action-${i}`} style={[styles.action, { opacity }]} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: SKELETON_BG,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    width: 100,
    height: 14,
    backgroundColor: SKELETON_BG,
    borderRadius: 4,
    marginBottom: 6,
  },
  handle: {
    width: 60,
    height: 12,
    backgroundColor: SKELETON_BG,
    borderRadius: 4,
  },
  content: {
    marginBottom: 12,
    marginLeft: CONTENT_LEFT_INSET,
  },
  line: {
    height: 14,
    backgroundColor: SKELETON_BG,
    borderRadius: 4,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: CONTENT_LEFT_INSET,
    paddingRight: 20,
    marginTop: 4,
  },
  action: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SKELETON_BG,
  },
});
```

### What changed and why

| Concern | Before | After |
|---|---|---|
| **Animation config** | Hardcoded inside `useEffect` — logic complected with imperative API calls | `buildPulseSequence()` is a **pure function** returning plain data; testable in Node without React Native |
| **Content lines** | Three copy-pasted `<Animated.View>` blocks with magic width strings | `buildContentLines()` returns an immutable array; rendered via `.map()` — single source of truth |
| **Action count** | Three identical JSX nodes | Derived from `ACTION_PLACEHOLDER_COUNT` constant; rendered via `Array.from` |
| **Animation lifecycle** | Inlined in component body | Extracted to `usePulseAnimation` custom hook — de-complects "what animates" from "how" |
| **Magic numbers** | `40`, `52`, `'#e5e7eb'` scattered in styles | Named constants (`AVATAR_SIZE`, `CONTENT_LEFT_INSET`, `SKELETON_BG`); `52` derived mathematically |
| **Unused import** | `Dimensions` / `Colors` imported but unused | Removed — no dead imports |
| **Return type** | Implicit | Explicit `React.JSX.Element` for type safety |
| **TSDoc** | None | Every exported function/constant documented |

All pure functions (`buildPulseSequence`, `buildContentLines`) are exported from the top of the file per the single-file constraint, ready to be promoted to a shared package later.