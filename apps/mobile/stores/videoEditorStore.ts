import { create } from 'zustand';

interface EditorState {
  // Video Layer
  videoUri: string | null;
  videoDuration: number;
  setVideo: (uri: string, duration?: number) => void;

  // Audio Layer
  audioUri: string | null;
  audioFilename: string | null;
  audioStartAt: number; // Defaults to 0
  audioVolume: number; // Defaults to 1.0
  setAudio: (uri: string, filename: string) => void;
  removeAudio: () => void;
  
  // Clean up
  reset: () => void;
}

export const useVideoEditorStore = create<EditorState>((set) => ({
  // Initial State
  videoUri: null,
  videoDuration: 0,
  audioUri: null,
  audioFilename: null,
  audioStartAt: 0,
  audioVolume: 1.0,

  // Actions
  setVideo: (uri, duration = 0) => set({ videoUri: uri, videoDuration: duration }),
  
  setAudio: (uri, filename) => set({ 
    audioUri: uri, 
    audioFilename: filename,
    audioStartAt: 0,
    audioVolume: 1.0 
  }),

  removeAudio: () => set({ 
    audioUri: null, 
    audioFilename: null, 
    audioStartAt: 0, 
    audioVolume: 1.0 
  }),

  reset: () => set({
    videoUri: null,
    videoDuration: 0,
    audioUri: null,
    audioFilename: null,
    audioStartAt: 0,
    audioVolume: 1.0
  })
}));
