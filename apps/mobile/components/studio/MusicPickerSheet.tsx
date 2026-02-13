

```tsx
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoEditorStore } from '@/stores/videoEditorStore';

// ─────────────────────────────────────────────────────────
// Pure Data & Logic (de-complected from UI)
// ─────────────────────────────────────────────────────────

/** Represents an audio track available for selection. */
export interface AudioTrack {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly duration: string;
  readonly uri: string;
}

/** Result of a successful audio pick from the document picker. */
export interface PickedAudio {
  readonly uri: string;
  readonly name: string;
}

/** Immutable list of recommended tracks. */
export const RECOMMENDED_TRACKS: readonly AudioTrack[] = Object.freeze([
  { id: '1', title: 'Trending: Hillsong', artist: 'Hillsong United', duration: '4:32', uri: 'mock-uri-1' },
  { id: '2', title: 'Lo-Fi Beats', artist: 'Chill Cow', duration: '2:15', uri: 'mock-uri-2' },
  { id: '3', title: 'Worship Instrumental', artist: 'Elevation', duration: '5:45', uri: 'mock-uri-3' },
]);

/**
 * Extracts a `PickedAudio` value from a DocumentPicker result.
 * Returns `null` if no valid asset was selected.
 * Pure function — no side effects, fully testable without Expo runtime.
 */
export function extractPickedAudio(
  result: DocumentPicker.DocumentPickerResult,
): PickedAudio | null {
  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }
  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name };
}

/**
 * Maps an `AudioTrack` to the minimal `PickedAudio` shape needed by the store.
 * Pure function — keeps selection logic decoupled from UI handlers.
 */
export function trackToPickedAudio(track: AudioTrack): PickedAudio {
  return { uri: track.uri, name: track.title };
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

interface MusicPickerSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

/**
 * Bottom-sheet modal that lets the user choose an audio track
 * from recommended tracks or from their device files.
 */
export default function MusicPickerSheet({ visible, onClose }: MusicPickerSheetProps) {
  const setAudio = useVideoEditorStore((state) => state.setAudio);

  /** Opens the device file picker and commits the selection. */
  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      const picked = extractPickedAudio(result);
      if (picked) {
        setAudio(picked.uri, picked.name);
        onClose();
      }
    } catch (err: unknown) {
      // TODO: surface to observability (OpenTelemetry span)
      console.error('[MusicPickerSheet] Error picking document:', err);
    }
  }, [setAudio, onClose]);

  /** Commits a recommended track selection. */
  const handleSelectTrack = useCallback(
    (track: AudioTrack) => {
      const picked = trackToPickedAudio(track);
      setAudio(picked.uri, picked.name);
      onClose();
    },
    [setAudio, onClose],
  );

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-zinc-900 rounded-t-3xl overflow-hidden h-2/3 border-t border-zinc-800">

          {/* ── Header ── */}
          <View className="p-4 border-b border-zinc-800 flex-row justify-between items-center">
            <Text className="text-white text-lg font-bold">Add Music</Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 bg-zinc-800 rounded-full"
              accessibilityLabel="Close music picker"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">

            {/* ── Pick from Files ── */}
            <TouchableOpacity
              onPress={handlePickDocument}
              className="flex-row items-center p-4 bg-zinc-800 rounded-xl mb-6 active:scale-95 transition-transform"
              accessibilityLabel="Pick audio from device files"
              accessibilityRole="button"
            >
              <View className="w-10 h-10 rounded-full bg-brand-purple items-center justify-center mr-4">
                <Ionicons name="folder-open" size={20} color="white" />
              </View>
              <View>
                <Text className="text-white font-bold text-base">Pick from Files</Text>
                <Text className="text-zinc-400 text-sm">Select audio from your device</Text>
              </View>
            </TouchableOpacity>

            {/* ── Recommended Section ── */}
            <Text className="text-zinc-500 font-bold mb-3 uppercase text-xs tracking-wider">
              Recommended
            </Text>

            {RECOMMENDED_TRACKS.map((track) => (
              <TouchableOpacity
                key={track.id}
                onPress={() => handleSelectTrack(track)}
                className="flex-row items-center justify-between p-3 mb-2 rounded-lg bg-zinc-800/50 active:bg-zinc-800"
                accessibilityLabel={`Select ${track.title} by ${track.artist}`}
                accessibilityRole="button"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-md bg-zinc-700 items-center justify-center mr-3">
                    <Ionicons name="musical-note" size={20} color="#7C3AED" />
                  </View>
                  <View>
                    <Text className="text-white font-medium">{track.title}</Text>
                    <Text className="text-zinc-500 text-xs">{track.artist}</Text>
                  </View>
                </View>
                <Text className="text-zinc-600 text-xs">{track.duration}</Text>
              </TouchableOpacity>
            ))}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
```

### What changed & why

| Concern | Before (Complected) | After (Simple) |
|---|---|---|
| **Pure logic extraction** | Document-picker result parsing was inlined inside the async handler — untestable without mocking Expo. | `extractPickedAudio()` is a **pure function** (Input → Output) exported at the top of the file. You can unit-test it with a plain object literal — zero Expo mocks needed. |
| **Track → audio mapping** | `handleSelectTrack` received raw `uri` and `title` strings, scattering knowledge of the shape across the call-site. | `trackToPickedAudio()` is a pure mapper from `AudioTrack → PickedAudio`. The handler passes the whole track value; the function decides what to extract. |
| **Values over objects** | Track data used an anonymous `{ id, title, ... }` literal type. | Explicit `AudioTrack` and `PickedAudio` **readonly interfaces** serve as the data contract (Zod schemas can wrap these later when they cross a trust boundary). |
| **Immutability** | `MOCK_TRACKS` was a mutable array. | `RECOMMENDED_TRACKS` is `readonly AudioTrack[]` + `Object.freeze`. |
| **Memoisation** | Handlers recreated every render. | `useCallback` stabilises `handlePickDocument` and `handleSelectTrack`. |
| **Accessibility** | No a11y attributes. | `accessibilityLabel` and `accessibilityRole` on every interactive element. |
| **Unused import** | `Colors` and `Platform` imported but never used. | Removed. |
| **Error typing** | `catch (err)` was untyped. | `catch (err: unknown)` — explicit, safe. |
| **TSDoc** | None. | Every exported function and interface is documented. |