import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

interface ComposePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostSuccess?: () => void;
}

export default function ComposePostModal({ visible, onClose, onPostSuccess }: ComposePostModalProps) {
  const { session } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    
    try {
      setLoading(true);
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('posts').insert({
        content: content.trim(),
        user_id: session.user.id,
      });

      if (error) throw error;

      setContent('');
      onPostSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert('Error', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideo = () => {
      onClose();
      router.push('/studio/create'); // Assuming this route exists or will exist
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.postButton, (!content.trim() || loading) && styles.postButtonDisabled]} 
            onPress={handlePost}
            disabled={!content.trim() || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
             {/* Avatar or Placeholder */}
            <View style={styles.avatar}>
                 <Ionicons name="person" size={20} color="#fff" />
            </View>
            
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder="What's on your mind?"
                    multiline
                    value={content}
                    onChangeText={setContent}
                    autoFocus
                />
                
                 {/* Attachments Area */}
                  <View style={styles.attachments}>
                        <TouchableOpacity style={styles.attachButton}>
                            <Ionicons name="book-outline" size={20} color={Colors.light.brand.primary || '#4A90E2'} />
                            <Text style={styles.attachText}>Verse</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.attachButton, { borderColor: '#7C3AED' }]} onPress={handleCreateVideo}>
                            <Ionicons name="videocam-outline" size={20} color="#7C3AED" />
                            <Text style={[styles.attachText, { color: '#7C3AED' }]}>Video</Text>
                        </TouchableOpacity>
                 </View>
            </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelText: {
    fontSize: 16,
    color: '#000',
  },
  postButton: {
    backgroundColor: Colors.light.brand.primary || '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    fontSize: 18,
    color: '#333',
    minHeight: 100,
    marginTop: 8,
  },
  attachments: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.brand.primary || '#4A90E2',
    borderRadius: 16,
    gap: 6,
  },
  attachText: {
    color: Colors.light.brand.primary || '#4A90E2',
    fontWeight: '500',
    fontSize: 14,
  },
});
