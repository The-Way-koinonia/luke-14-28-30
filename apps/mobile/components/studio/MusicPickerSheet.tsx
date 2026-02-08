import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoEditorStore } from '@/stores/videoEditorStore';
import { Colors } from '@/constants/theme';

interface MusicPickerSheetProps {
  visible: boolean;
  onClose: () => void;
}

const MOCK_TRACKS = [
  { id: '1', title: 'Trending: Hillsong', artist: 'Hillsong United', duration: '4:32', uri: 'mock-uri-1' },
  { id: '2', title: 'Lo-Fi Beats', artist: 'Chill Cow', duration: '2:15', uri: 'mock-uri-2' },
  { id: '3', title: 'Worship Instrumental', artist: 'Elevation', duration: '5:45', uri: 'mock-uri-3' },
];

export default function MusicPickerSheet({ visible, onClose }: MusicPickerSheetProps) {
  const setAudio = useVideoEditorStore((state) => state.setAudio);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAudio(asset.uri, asset.name);
        onClose();
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const handleSelectTrack = (uri: string, title: string) => {
    setAudio(uri, title);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-zinc-900 rounded-t-3xl overflow-hidden h-2/3 border-t border-zinc-800">
          
          {/* Header */}
          <View className="p-4 border-b border-zinc-800 flex-row justify-between items-center">
            <Text className="text-white text-lg font-bold">Add Music</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800 rounded-full">
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            
            {/* Pick from Files Button */}
            <TouchableOpacity 
              onPress={handlePickDocument}
              className="flex-row items-center p-4 bg-zinc-800 rounded-xl mb-6 active:scale-95 transition-transform"
            >
              <View className="w-10 h-10 rounded-full bg-brand-purple items-center justify-center mr-4">
                <Ionicons name="folder-open" size={20} color="white" />
              </View>
              <View>
                <Text className="text-white font-bold text-base">Pick from Files</Text>
                <Text className="text-zinc-400 text-sm">Select audio from your device</Text>
              </View>
            </TouchableOpacity>

            <Text className="text-zinc-500 font-bold mb-3 uppercase text-xs tracking-wider">Recommended</Text>

            {/* Mock Tracks List */}
            {MOCK_TRACKS.map((track) => (
              <TouchableOpacity 
                key={track.id}
                onPress={() => handleSelectTrack(track.uri, track.title)}
                className="flex-row items-center justify-between p-3 mb-2 rounded-lg bg-zinc-800/50 active:bg-zinc-800"
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
