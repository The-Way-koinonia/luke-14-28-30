import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';

export default function EditProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, bio, avatar_url`)
        .eq('id', session.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // We need base64 for Supabase upload if not using FormDataShim
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageFile(result.assets[0]);
      setAvatarUrl(result.assets[0].uri); // Preview
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      let publicAvatarUrl = avatarUrl; // Default to existing

      // 1. Upload Image if changed
      if (imageFile && imageFile.base64) {
         const fileExt = imageFile.uri.split('.').pop();
         const fileName = `${session.user.id}/${Math.random()}.${fileExt}`;
         const filePath = `${fileName}`;

         const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, decode(imageFile.base64), {
                contentType: imageFile.mimeType || 'image/jpeg',
                upsert: true
            });

         if (uploadError) throw uploadError;

         const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
         publicAvatarUrl = publicUrl;
      }

      // 2. Update Profile
      const updates = {
        id: session.user.id,
        username,
        bio,
        avatar_url: publicAvatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
          title: 'Edit Profile',
          headerStyle: { backgroundColor: Colors.light.brand.purple.DEFAULT },
          headerTintColor: '#fff',
      }} />

      <View style={styles.content}>
        {/* Avatar Section */}
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, styles.placeholder]}>
                    <Ionicons name="camera" size={40} color="#fff" />
                </View>
            )}
            <View style={styles.editBadge}>
                 <Ionicons name="pencil" size={16} color="#fff" />
            </View>
        </TouchableOpacity>

        <Text style={styles.label}>Username</Text>
        <TextInput 
            style={styles.input} 
            value={username} 
            onChangeText={setUsername} 
            placeholder="Username" 
            autoCapitalize="none"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput 
            style={[styles.input, styles.bioInput]} 
            value={bio} 
            onChangeText={setBio} 
            placeholder="Tell us about your walk with God..." 
            multiline 
        />

        <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabledButton]} 
            onPress={updateProfile}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholder: {
      backgroundColor: '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
  },
  editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: Colors.light.brand.purple.DEFAULT,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#fff',
  },
  label: {
      alignSelf: 'flex-start',
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#374151',
  },
  input: {
      width: '100%',
      backgroundColor: '#f9fafb',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      marginBottom: 24,
  },
  bioInput: {
      height: 120,
      textAlignVertical: 'top',
  },
  saveButton: {
      width: '100%',
      backgroundColor: Colors.light.brand.purple.DEFAULT,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
  },
  disabledButton: {
      opacity: 0.7,
  },
  saveButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
  }
});
