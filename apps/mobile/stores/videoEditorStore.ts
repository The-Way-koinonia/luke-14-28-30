

```ts
// apps/mobile/stores/videoEditorStore.ts

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Pure Data: Default values as an immutable constant (Values over Objects)
// ---------------------------------------------------------------------------

/** Default audio layer state. Single source of truth for audio resets. */
const DEFAULT_AUDIO_STATE = {
  audioUri: null as string | null,
  audioFilename: null as string | null,
  audioStartAt: 0,
  audioVolume: 1.0,
} as const satisfies AudioLayerState;

/** Default video layer state. Single source of truth for video resets. */
const DEFAULT_VIDEO_STATE = {
  videoUri: null as string | null,
  videoDuration: 0,
} as const satisfies VideoLayerState;

// ---------------------------------------------------------------------------
// Pure Logic: Extracted functions — testable without Zustand or any runtime
// ---------------------------------------------------------------------------

/**
 * Produces the next video-layer state from a URI and optional duration.
 * @param uri - Absolute file URI for the video asset.
 * @param duration - Duration in seconds (defaults to 0 if unknown).
 * @returns A new, immutable video-layer state object.
 */
export const buildVideoState = (
  uri: string,
  duration: number = 0,
): VideoLayerState => ({
  videoUri: uri,
  videoDuration: duration,
});

/**
 * Produces the next audio-layer state from a URI and display filename.
 * Audio offset and volume are reset to defaults on every new selection.
 * @param uri - Absolute file URI for the audio asset.
 * @param filename - Human-readable filename for UI display.
 * @returns A new, immutable audio-layer state object.
 */
export const buildAudioState = (
  uri: string,
  filename: string,
): AudioLayerState => ({
  ...DEFAULT_AUDIO_STATE,
  audioUri: uri,
  audioFilename: filename,
});

/**
 * Derives a full "clean" editor state suitable for a complete reset.
 * @returns A new, immutable editor initial-state object.
 */
export const buildInitialEditorState = (): VideoLayerState & AudioLayerState => ({
  ...DEFAULT_VIDEO_STATE,
  ...DEFAULT_AUDIO_STATE,
});

// ---------------------------------------------------------------------------
// Interfaces (Contracts)
// ---------------------------------------------------------------------------

/** State slice for the video layer. */
interface VideoLayerState {
  videoUri: string | null;
  videoDuration: number;
}

/** State slice for the audio layer. */
interface AudioLayerState {
  audioUri: string | null;
  audioFilename: string | null;
  audioStartAt: number;
  audioVolume: number;
}

/** Full editor store contract: state + actions. */
interface EditorState extends VideoLayerState, AudioLayerState {
  /** Set the primary video asset. */
  setVideo: (uri: string, duration?: number) => void;
  /** Attach a background audio track (resets offset & volume). */
  setAudio: (uri: string, filename: string) => void;
  /** Remove the background audio track. */
  removeAudio: () => void;
  /** Reset the entire editor to its initial state. */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store (Thin orchestration — delegates to pure functions above)
// ---------------------------------------------------------------------------

export const useVideoEditorStore = create<EditorState>((set) => ({
  // Initial state
  ...buildInitialEditorState(),

  // Actions — each is a thin wrapper that sets the result of a pure function
  setVideo: (uri, duration) => set(buildVideoState(uri, duration)),

  setAudio: (uri, filename) => set(buildAudioState(uri, filename)),

  removeAudio: () => set({ ...DEFAULT_AUDIO_STATE }),

  reset: () => set(buildInitialEditorState()),
}));
```

### What changed and why

| Concern | Before | After |
|---|---|---|
| **Duplicated reset literals** | `audioStartAt: 0, audioVolume: 1.0` repeated 4× — a classic complecting of "what the defaults are" with "where they're used." | `DEFAULT_AUDIO_STATE` / `DEFAULT_VIDEO_STATE` constants — single source of truth. |
| **Logic inside store** | State shape construction was inlined in every Zustand `set()` call. Untestable without mounting the store. | `buildVideoState`, `buildAudioState`, `buildInitialEditorState` are **pure functions** you can unit-test with plain `assert` — zero Zustand dependency. |
| **Interfaces** | Single flat `EditorState` mixed video, audio, and actions. | De-complected into `VideoLayerState`, `AudioLayerState`, and `EditorState` (composition). Easier to extend (e.g., add a `TextLayerState` later). |
| **TSDoc** | None. | Every exported function and interface is documented. |
| **`satisfies` guard** | N/A | Default constants use `satisfies` to catch typos at compile time without widening the type. |