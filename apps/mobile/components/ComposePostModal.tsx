import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Modal, TouchableOpacity, Text, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface ComposePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostSuccess?: () => void;
}

export default function ComposePostModal({ visible, onClose, onPostSuccess }: ComposePostModalProps) {
  const { session } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Verse attachment state (placeholder for now)
  const [verseAttached, setVerseAttached] = useState<string | null>(null);

  const handlePost = async () => {
    if (!session?.user) {
        Alert.alert('Error', 'You must be logged in to post.');
        return;
    }

    if (!content.trim()) return;

    setLoading(true);
    try {
        const { error } = await supabase
            .from('posts')
            .insert({
                content: content.trim(),
                user_id: session.user.id,
                // verse_ref: verseAttached // Future integration
            });

        if (error) throw error;

        setContent('');
        setVerseAttached(null);
        onPostSuccess?.();
        onClose();
    } catch (error: any) {
        Alert.alert('Error Posting', error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleAttachVerse = () => {
      console.log('Attach verse clicked');
      // Placeholder interaction - could open a verse picker modal in the future
      Alert.alert('Coming Soon', 'Verse attachment picker will go here.');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={handlePost} 
                    disabled={loading || !content.trim()}
                    style={[styles.postButton, (!content.trim() || loading) && styles.postButtonDisabled]}
                >
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
                {/* User Avatar Placeholder */}
                <View style={styles.avatar}>
                     <Ionicons name="person" size={20} color="#fff" />
                </View>

                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="What's on your heart?"
                        multiline
                        autoFocus
                        value={content}
                        onChangeText={setContent}
                        textAlignVertical="top"
                    />
                    
                    {/* Attachments Area */}
                    <View style={styles.attachments}>
                        <TouchableOpacity style={styles.attachButton} onPress={handleAttachVerse}>
                            <Ionicons name="book-outline" size={20} color="#4A90E2" />
                            <Text style={styles.attachText}>Attach Verse</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    backgroundColor: '#007AFF', // brand-blue
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#99c9ff',
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
  },
  attachments: {
    marginTop: 16,
    flexDirection: 'row',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 16,
    gap: 6,
  },
  attachText: {
    color: '#4A90E2',
    fontWeight: '500',
    fontSize: 14,
  },
});
