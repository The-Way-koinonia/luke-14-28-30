

```tsx
// apps/mobile/app/studio/create.tsx

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useCallback } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoEditorStore } from '@/stores/videoEditorStore';
import MusicPickerSheet from '@/components/studio/MusicPickerSheet';

// ---------------------------------------------------------------------------
// Pure Logic — extracted at the top of the file per constraint.
// These functions are de-complected from UI and side-effects.
// ---------------------------------------------------------------------------

/** Maximum recording duration in seconds. */
const MAX_RECORDING_DURATION_S = 60;

/**
 * Toggles a camera facing value between 'back' and 'front'.
 * Pure function — no side-effects.
 *
 * @param current - The current camera facing direction.
 * @returns The opposite camera facing direction.
 */
export function toggleFacing(current: CameraType): CameraType {
  return current === 'back' ? 'front' : 'back';
}

/**
 * Determines the screen mode that should follow a successful recording.
 * Returns `null` when the recording produced no usable URI.
 *
 * @param uri - The URI returned by the camera, or `undefined`.
 * @returns An object with the validated `uri` or `null` if invalid.
 */
export function resolveRecordingResult(
  uri: string | undefined,
): { uri: string; duration: number } | null {
  if (!uri || uri.trim().length === 0) {
    return null;
  }
  return { uri, duration: MAX_RECORDING_DURATION_S };
}

/**
 * Derives which UI mode to display based on the current video URI.
 *
 * @param videoUri - The current video URI (or null).
 * @param explicitMode - The mode the user explicitly set.
 * @returns The effective display mode.
 */
export function deriveDisplayMode(
  videoUri: string | null,
  explicitMode: 'camera' | 'preview',
): 'camera' | 'preview' {
  if (explicitMode === 'preview' && videoUri) {
    return 'preview';
  }
  return 'camera';
}

// ---------------------------------------------------------------------------
// Screen Component
// ---------------------------------------------------------------------------

export default function StudioCreateScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [mode, setMode] = useState<'camera' | 'preview'>('camera');

  // Store & Sheet State
  const setVideo = useVideoEditorStore((state) => state.setVideo);
  const [showMusicSheet, setShowMusicSheet] = useState(false);

  // Derived display mode — pure calculation, no side-effects.
  const displayMode = deriveDisplayMode(videoUri, mode);

  // ------ Handlers (thin orchestration over pure logic) ------

  const handleToggleFacing = useCallback(() => {
    setFacing((current) => toggleFacing(current));
  }, []);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current) return;

    setIsRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_RECORDING_DURATION_S,
      });

      const result = resolveRecordingResult(video?.uri);
      if (result) {
        setVideoUri(result.uri);
        setVideo(result.uri, result.duration);
        setMode('preview');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      console.error('[StudioCreate] Recording failed:', message);
      Alert.alert('Error', 'Failed to record video');
    } finally {
      setIsRecording(false);
    }
  }, [setVideo]);

  const stopRecording = useCallback(() => {
    if (isRecording && cameraRef.current) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleDiscard = useCallback(() => {
    setVideoUri(null);
    setMode('camera');
  }, []);

  const handleNext = useCallback(() => {
    Alert.alert(
      'Coming Soon',
      'Video processing and post creation will be implemented next!',
    );
  }, []);

  const handleOpenMusicSheet = useCallback(() => setShowMusicSheet(true), []);
  const handleCloseMusicSheet = useCallback(() => setShowMusicSheet(false), []);
  const handleGoBack = useCallback(() => router.back(), [router]);

  // ------ Permission gates ------

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // ------ Preview Mode ------

  if (displayMode === 'preview' && videoUri) {
    return (
      <View style={styles.container}>
        <Video
          style={styles.video}
          source={{ uri: videoUri }}
          useNativeControls
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay
        />

        <SafeAreaView style={styles.overlay} edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={handleDiscard}
              style={styles.iconButton}
              accessibilityLabel="Discard recording"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextButton}
              accessibilityLabel="Continue to next step"
              accessibilityRole="button"
            >
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ------ Camera Mode ------

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        mode="video"
        ref={cameraRef}
      >
        <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
          {/* Header: Close Button */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.iconButton}
              accessibilityLabel="Close studio"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <View style={styles.flashBadge}>
              <Ionicons name="flash-off" size={16} color="white" />
            </View>
          </View>

          {/* Right Sidebar Tools */}
          <View style={styles.sidebar}>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={handleOpenMusicSheet}
              accessibilityLabel="Pick music"
              accessibilityRole="button"
            >
              <Ionicons name="musical-notes" size={24} color="white" />
              <Text style={styles.toolLabel}>Music</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              accessibilityLabel="Change speed"
              accessibilityRole="button"
            >
              <Ionicons name="speedometer-outline" size={24} color="white" />
              <Text style={styles.toolLabel}>Speed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              accessibilityLabel="Set timer"
              accessibilityRole="button"
            >
              <Ionicons name="timer-outline" size={24} color="white" />
              <Text style={styles.toolLabel}>Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              onPress={handleToggleFacing}
              accessibilityLabel="Flip camera"
              accessibilityRole="button"
            >
              <Ionicons name="camera-reverse-outline" size={24} color="white" />
              <Text style={styles.toolLabel}>Flip</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Controls: Record Button */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.recordOuter}
              onLongPress={startRecording}
              onPressOut={stopRecording}
              delayLongPress={100}
              accessibilityLabel={
                isRecording ? 'Release to stop recording' : 'Hold to record'
              }
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.recordInner,
                  isRecording && styles.recordingActive,
                ]}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>

      <MusicPickerSheet
        visible={showMusicSheet}
        onClose={handleCloseMusicSheet}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  flashBadge: {
    padding: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  nextText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  sidebar: {
    position: 'absolute',
    right: 16,
    top: 100,
    gap: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 30,
  },
  toolButton: {
    alignItems: 'center',
    gap: 4,
  },
  toolLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  bottomControls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff4040',
  },
  recordingActive: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
});
```

### What changed and why

| Concern | Before | After | Principle |
|---|---|---|---|
| **Camera facing toggle** | Inline anonymous arrow `setFacing(current => ...)` with logic inside setter | `toggleFacing()` — exported pure function, called inside `useCallback` | **De-complect logic from UI state** |
| **Recording result validation** | `if (video?.uri)` with inline store call and magic number | `resolveRecordingResult(uri)` — pure function returns typed result or `null`; `MAX_RECORDING_DURATION_S` constant | **Values > inline branching; named constants** |
| **Display mode derivation** | Implicit `if (mode === 'preview' && videoUri)` scattered in render | `deriveDisplayMode(videoUri, mode)` — pure, testable in Node without React | **Simple Made Easy: testable without mocking** |
| **Error handling** | Bare `console.error(e)` | Typed `e: unknown`, extracts message, prefixed log | **Security protocol: typed errors** |
| **Handler stability** | Functions declared inside render body (re-created every render) | All handlers wrapped in `useCallback` with explicit deps | **Performance & correctness** |
| **Accessibility** | No `accessibilityLabel` / `accessibilityRole` | Added to every `TouchableOpacity` | **Reliability** |
| **Magic numbers** | `60` used in two places | `MAX_RECORDING_DURATION_S` constant | **Simple: one source of truth** |

All three exported pure functions (`toggleFacing`, `resolveRecordingResult`, `deriveDisplayMode`) can be unit-tested with a plain `node` + `vitest` script — zero React/Expo mocking required.