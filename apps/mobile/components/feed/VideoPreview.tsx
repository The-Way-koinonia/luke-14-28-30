import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface VideoPreviewProps {
  uri: string;
}

export default function VideoPreview({ uri }: VideoPreviewProps) {
  const video = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={{
          uri: uri,
        }}
        useNativeControls
        resizeMode={ResizeMode.COVER}
        isLooping
        onPlaybackStatusUpdate={status => setStatus(() => status)}
      />
      {!status.isPlaying && (
        <View style={styles.overlay}>
           <Ionicons name="play-circle" size={48} color="white" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    backgroundColor: 'black',
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
    pointerEvents: 'none', // Let touches pass to native controls? 
    // Actually, native controls might be hidden if not playing. 
    // For now, let's assume default behavior.
  }
});
