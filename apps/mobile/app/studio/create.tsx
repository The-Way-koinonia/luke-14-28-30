import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Modal, Alert, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoEditorStore } from '@/stores/videoEditorStore';
import MusicPickerSheet from '@/components/studio/MusicPickerSheet';

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

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const startRecording = async () => {
    if (cameraRef.current) {
        setIsRecording(true);
        try {
            const video = await cameraRef.current.recordAsync({
                maxDuration: 60, // 60 seconds limit
            });
            if (video?.uri) {
                setVideoUri(video.uri);
                setVideo(video.uri, 60); // Mock duration for now, or use video.duration if available
                setMode('preview');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to record video');
        } finally {
            setIsRecording(false);
        }
    }
  };

  const stopRecording = () => {
      if (isRecording && cameraRef.current) {
          cameraRef.current.stopRecording();
          setIsRecording(false);
      }
  };

  const handleDiscard = () => {
      setVideoUri(null);
      setMode('camera');
  };

  const handleNext = () => {
      Alert.alert('Coming Soon', 'Video processing and post creation will be implemented next!');
  };

  if (mode === 'preview' && videoUri) {
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
                      <TouchableOpacity onPress={handleDiscard} style={styles.iconButton}>
                          <Ionicons name="close" size={28} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                          <Text style={styles.nextText}>Next</Text>
                          <Ionicons name="chevron-forward" size={20} color="white" />
                      </TouchableOpacity>
                  </View>
              </SafeAreaView>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} mode="video" ref={cameraRef}>
        <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
            
            {/* Header: Close Button */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <View style={styles.flashBadge}>
                     <Ionicons name="flash-off" size={16} color="white" />
                </View>
            </View>

            {/* Right Sidebar Tools */}
            <View style={styles.sidebar}>
                <TouchableOpacity style={styles.toolButton} onPress={() => setShowMusicSheet(true)}>
                    <Ionicons name="musical-notes" size={24} color="white" />
                    <Text style={styles.toolLabel}>Music</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolButton}>
                    <Ionicons name="speedometer-outline" size={24} color="white" />
                    <Text style={styles.toolLabel}>Speed</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolButton}>
                    <Ionicons name="timer-outline" size={24} color="white" />
                    <Text style={styles.toolLabel}>Timer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolButton} onPress={toggleCameraFacing}>
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
                    // Fallback for simple tap to start/stop if needed, but "Hold" is requested
                    // For better UX, we might add tap-to-record toggle logic later.
                    // Current implementation: Hold to record.
                >
                    <View style={[styles.recordInner, isRecording && styles.recordingActive]} />
                </TouchableOpacity>
            </View>

        </SafeAreaView>
      </CameraView>
      
      <MusicPickerSheet 
        visible={showMusicSheet} 
        onClose={() => setShowMusicSheet(false)} 
      />
    </View>
  );
}

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
     // Placeholder
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
      borderRadius: 8, // Morph to square
  },
});
