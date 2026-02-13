

```tsx
// apps/mobile/components/hello-wave.tsx

import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Pure Logic: Animation configuration extracted as plain values.
// Testable without any RN runtime — just data describing the animation.
// ---------------------------------------------------------------------------

/** Describes a single wave animation's parameters. */
export interface WaveAnimationConfig {
  /** Peak rotation in degrees at the midpoint of each wave. */
  readonly peakRotationDeg: number;
  /** Duration (ms) of a single half-swing (rest → peak, or peak → rest). */
  readonly halfSwingDurationMs: number;
  /** Total number of full back-and-forth repetitions. */
  readonly repetitions: number;
}

/** Default wave animation configuration. */
export const DEFAULT_WAVE_CONFIG: WaveAnimationConfig = {
  peakRotationDeg: 25,
  halfSwingDurationMs: 150, // 150ms × 2 = 300ms per full swing
  repetitions: 4,
} as const;

/**
 * Derives the rotation string for a given angle in degrees.
 *
 * @param deg - Rotation angle in degrees.
 * @returns A CSS-style rotation string, e.g. `"25deg"`.
 */
export const toRotationString = (deg: number): string => `${deg}deg`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders an animated waving-hand emoji.
 *
 * The animation parameters are driven by {@link DEFAULT_WAVE_CONFIG} (pure
 * data) so the timing logic can be unit-tested independently of React Native.
 */
export function HelloWave() {
  const { peakRotationDeg, halfSwingDurationMs, repetitions } =
    DEFAULT_WAVE_CONFIG;

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(peakRotationDeg, {
          duration: halfSwingDurationMs,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: halfSwingDurationMs,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      repetitions,
    );
  }, [peakRotationDeg, halfSwingDurationMs, repetitions, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: toRotationString(rotation.value) }],
  }));

  return (
    <Animated.Text
      style={[
        {
          fontSize: 28,
          lineHeight: 32,
          marginTop: -6,
        },
        animatedStyle,
      ]}
    >
      👋
    </Animated.Text>
  );
}
```

### What changed and why

| Concern | Before (Complected) | After (Simple) |
|---|---|---|
| **Animation config** | Magic numbers inlined in a non-standard `style` object (`animationName`, `animationIterationCount`) that Reanimated doesn't actually support on native. | Extracted to `DEFAULT_WAVE_CONFIG` — a plain, immutable, testable value. |
| **Rotation logic** | Embedded inside JSX style literal. | `toRotationString()` — a pure function exportable and unit-testable with zero RN mocking. |
| **Animation execution** | Relied on a CSS-like `animationName` API that doesn't exist in `react-native-reanimated`. | Uses the correct Reanimated 3 primitives (`useSharedValue`, `withRepeat`, `withSequence`, `withTiming`, `useAnimatedStyle`). |
| **Style separation** | Single mixed style object. | Static layout styles are separated from the animated transform via the `style` array pattern, avoiding unnecessary re-creation of the layout object. |
| **Testability** | Nothing extractable. | `WaveAnimationConfig`, `DEFAULT_WAVE_CONFIG`, and `toRotationString` can all be imported and tested in a plain Node script. |