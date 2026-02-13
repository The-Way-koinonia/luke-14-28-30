

```tsx
// apps/mobile/components/feed/VideoPreview.tsx

import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Pure Logic (extracted, testable without React/Expo internals)
// ---------------------------------------------------------------------------

/**
 * Derives whether the video is currently playing from an `AVPlaybackStatus`.
 *
 * Returns `true` only when the status is loaded AND the media is actively
 * playing. Every other state (loading, error, buffering-while-paused, etc.)
 * is treated as "not playing" so the overlay is shown.
 */
export function deriveIsPlaying(status: AVPlaybackStatus): boolean {
  if (!status.isLoaded) return false;
  return status.isPlaying;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Props for {@link VideoPreview}. */
export interface VideoPreviewProps {
  /** Absolute or remote URI pointing to a playable video asset. */
  uri: string;
}

/**
 * Renders an inline video player with a play-icon overlay when paused.
 *
 * Uses `expo-av` native controls for transport; the overlay is purely
 * decorative (pointer-events disabled) so it never intercepts touches.
 */
export default function VideoPreview({ uri }: VideoPreviewProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * Stable callback fed to `<Video>`. Delegates to the pure
   * `deriveIsPlaying` helper so playback-state logic stays testable.
   */
  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      setIsPlaying(deriveIsPlaying(status));
    },
    [],
  );

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri }}
        useNativeControls
        resizeMode={ResizeMode.COVER}
        isLooping
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      {!isPlaying && (
        <View style={styles.overlay} pointerEvents="none">
          <Ionicons name="play-circle" size={48} color="white" />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
```

### What changed & why

| Concern | Before (Complected) | After (Simple) |
|---|---|---|
| **Playback state derivation** | Stored the entire opaque `any` status object in React state; `isPlaying` check embedded in JSX. | Extracted to **`deriveIsPlaying(status)`** — a pure, exported function that can be unit-tested in a plain Node script with a fake `AVPlaybackStatus` value. No Expo/React mock needed. |
| **Type safety** | `useState<any>({})` — no compile-time guarantees; accessing `.isPlaying` on `{}` is silently `undefined`. | State is a single `boolean`. The callback receives the properly typed `AVPlaybackStatus` and branches on `isLoaded` before reading `.isPlaying`, eliminating the runtime hazard. |
| **Render stability** | `setStatus(() => status)` created a new closure every frame of playback (≈ 60 Hz). The `<Video>` `onPlaybackStatusUpdate` prop was also an anonymous arrow re-created every render. | `handlePlaybackStatusUpdate` is wrapped in `useCallback` (stable ref). State only stores a boolean, so React skips re-renders when the derived value hasn't changed. |
| **`pointerEvents`** | Set inside `StyleSheet` — valid on web but a prop on RN `<View>`. Behaviour was ambiguous. | Moved to the `<View pointerEvents="none">` prop where React Native expects it, making intent explicit. |
| **Unused imports** | `TouchableOpacity`, `Text`, `Colors` imported but never used. | Removed — smaller bundle, no lint warnings. |
| **Documentation** | None. | TSDoc on the pure function, props interface, and component per the Execution Protocol. |