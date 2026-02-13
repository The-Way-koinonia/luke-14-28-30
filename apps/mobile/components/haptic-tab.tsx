

```tsx
// apps/mobile/components/haptic-tab.tsx

import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import type { GestureResponderEvent } from 'react-native';

// ─── Pure Logic (extracted, testable without React) ───────────────────────────

/**
 * Determines whether haptic feedback should fire on the current platform.
 *
 * @param platform - The value of `process.env.EXPO_OS` (or equivalent).
 * @returns `true` when haptics are appropriate for this platform.
 */
export const shouldFireHaptic = (platform: string | undefined): boolean =>
  platform === 'ios';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A tab-bar button that triggers light haptic feedback on supported platforms.
 *
 * Delegates all remaining behaviour to `PlatformPressable`.
 */
export function HapticTab(props: BottomTabBarButtonProps) {
  const { onPressIn, ...rest } = props;

  const handlePressIn = (ev: GestureResponderEvent): void => {
    if (shouldFireHaptic(process.env.EXPO_OS)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPressIn?.(ev);
  };

  return <PlatformPressable {...rest} onPressIn={handlePressIn} />;
}
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **Logic entangled with JSX** | Platform check lived inline inside the `onPressIn` callback | Extracted to `shouldFireHaptic` — a **pure function** (string → boolean) that can be unit-tested in plain Node without mocking React or Expo. |
| **Props spreading hygiene** | `{...props}` spread first, then `onPressIn` overrode it implicitly | Destructure `onPressIn` out of props, spread `rest`, and pass a single explicit `handlePressIn` — no hidden override order. |
| **Type safety** | Inline arrow had no explicit parameter type | `handlePressIn` is typed with `GestureResponderEvent`. |
| **TSDoc** | None | Every exported symbol is documented per the Execution Protocol. |