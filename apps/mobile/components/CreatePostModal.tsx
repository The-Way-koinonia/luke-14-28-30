import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Modal, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocialFeed } from '../hooks/useSocialFeed';
import { PostVisibility } from '../types/social';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose }) => {
  const { createPost, isMfaRequired } = useSocialFeed();
  const [content, setContent] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState<PostVisibility>('public');

  const handleCreate = async () => {
    if (!content.trim()) {
        Alert.alert('Error', 'Content cannot be empty');
        return;
    }

    setLoading(true);
    const result = await createPost({
        content,
        verse_ref: verseRef,
        visibility
    });
    setLoading(false);

    if (result) {
        // Success
        setContent('');
        setVerseRef('');
        onClose();
    } else {
        // Error handling handled inside hook (MFA or other)
        if (isMfaRequired) {
            Alert.alert("Security Check", "Multi-Factor Authentication is required to post.");
        }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New Reflection</Text>
            <TouchableOpacity onPress={handleCreate} disabled={loading}>
                {loading ? <ActivityIndicator color="#007AFF" /> : <Text style={styles.postText}>Post</Text>}
            </TouchableOpacity>
        </View>

        <TextInput
            style={styles.input}
            multiline
            placeholder="Share your thoughts..."
            value={content}
            onChangeText={setContent}
        />

        <View style={styles.fieldContainer}>
            <Ionicons name="book-outline" size={20} color="#666" />
            <TextInput
                style={styles.fieldInput}
                placeholder="Verse Ref (e.g. JHN.3.16)"
                value={verseRef}
                onChangeText={setVerseRef}
                autoCapitalize="characters"
            />
        </View>

        <View style={styles.visibilityContainer}>
             <Text style={styles.label}>Visibility:</Text>
             <View style={styles.toggleRow}>
                 {(['public', 'friends', 'private'] as PostVisibility[]).map((v) => (
                     <TouchableOpacity 
                        key={v} 
                        style={[styles.toggleBtn, visibility === v && styles.toggleBtnActive]}
                        onPress={() => setVisibility(v)}
                     >
                         <Text style={[styles.toggleText, visibility === v && styles.toggleTextActive]}>
                             {v.charAt(0).toUpperCase() + v.slice(1)}
                         </Text>
                     </TouchableOpacity>
                 ))}
             </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  postText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  input: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  fieldInput: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
  },
  visibilityContainer: {
      gap: 8,
  },
  label: {
      fontSize: 14,
      color: '#666',
      fontWeight: '600',
  },
  toggleRow: {
      flexDirection: 'row',
      gap: 10,
  },
  toggleBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: '#f2f2f7',
  },
  toggleBtnActive: {
      backgroundColor: '#000',
  },
  toggleText: {
      color: '#000',
  },
  toggleTextActive: {
      color: '#fff',
  }
});
