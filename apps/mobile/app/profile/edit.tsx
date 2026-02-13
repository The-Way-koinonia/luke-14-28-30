

```tsx
// apps/mobile/app/profile/edit.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import { z } from 'zod';

// ──────────────────────────────────────────────
// 1. PURE LOGIC — Extracted, testable without mocks
// ──────────────────────────────────────────────

/** Zod schema for profile form validation. */
const ProfileFormSchema = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(30, 'Username must be 30 characters or fewer')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username may only contain letters, numbers, and underscores',
    ),
  bio: z.string().max(300, 'Bio must be 300 characters or fewer').optional().default(''),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

/**
 * Validates profile form input.
 * @returns `{ success: true, data }` or `{ success: false, error: string }`.
 */
export function validateProfileForm(
  input: unknown,
): { success: true; data: ProfileFormValues } | { success: false; error: string } {
  const result = ProfileFormSchema.safeParse(input);
  if (!result.success) {
    const firstIssue = result.error.issues[0]?.message ?? 'Validation error';
    return { success: false, error: firstIssue };
  }
  return { success: true, data: result.data };
}

/**
 * Derives a storage file path for an avatar upload.
 * Pure function — no side-effects.
 *
 * @param userId  - The authenticated user's ID.
 * @param uri     - The local file URI (used to extract extension).
 * @param nonce   - A random value for cache-busting (inject for testability).
 */
export function buildAvatarPath(userId: string, uri: string, nonce: number): string {
  const ext = uri.split('.').pop() ?? 'jpg';
  return `${userId}/${nonce}.${ext}`;
}

/**
 * Builds the upsert payload for the profiles table.
 * Pure function — no DB dependency.
 */
export function buildProfileUpdate(
  userId: string,
  form: ProfileFormValues,
  avatarUrl: string | null,
  now: Date,
) {
  return {
    id: userId,
    username: form.username,
    bio: form.bio,
    avatar_url: avatarUrl,
    updated_at: now,
  };
}

// ──────────────────────────────────────────────
// 2. REPOSITORY helpers (thin wrappers around Supabase)
// ──────────────────────────────────────────────

interface ProfileRow {
  username: string;
  bio: string | null;
  avatar_url: string | null;
}

async function fetchProfile(userId: string): Promise<ProfileRow> {
  const { data, error, status } = await supabase
    .from('profiles')
    .select('username, bio, avatar_url')
    .eq('id', userId)
    .single();

  if (error && status !== 406) throw error;
  if (!data) throw new Error('Profile not found');
  return data as ProfileRow;
}

async function uploadAvatar(
  filePath: string,
  base64: string,
  contentType: string,
): Promise<string> {
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, decode(base64), {
      contentType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return publicUrl;
}

async function upsertProfile(updates: ReturnType<typeof buildProfileUpdate>): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(updates);
  if (error) throw error;
}

// ──────────────────────────────────────────────
// 3. UI COMPONENT — Orchestration only
// ──────────────────────────────────────────────

export default function EditProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    if (session?.user) {
      loadProfile(session.user.id);
    }
  }, [session]);

  // ── Load ──────────────────────────────────
  async function loadProfile(userId: string) {
    try {
      setLoading(true);
      const profile = await fetchProfile(userId);
      setUsername(profile.username ?? '');
      setBio(profile.bio ?? '');
      setAvatarUrl(profile.avatar_url);
    } catch (err) {
      if (err instanceof Error) Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Image Picker ──────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setImageFile(result.assets[0]);
      setAvatarUrl(result.assets[0].uri); // local preview
    }
  };

  // ── Save ──────────────────────────────────
  const handleSave = async () => {
    if (!session?.user) {
      Alert.alert('Error', 'No authenticated user.');
      return;
    }

    // Validate with pure function
    const validation = validateProfileForm({ username, bio });
    if (!validation.success) {
      Alert.alert('Validation Error', validation.error);
      return;
    }

    try {
      setLoading(true);
      const userId = session.user.id;
      let resolvedAvatarUrl = avatarUrl;

      // Upload image if user selected a new one
      if (imageFile?.base64) {
        const filePath = buildAvatarPath(userId, imageFile.uri, Math.random());
        resolvedAvatarUrl = await uploadAvatar(
          filePath,
          imageFile.base64,
          imageFile.mimeType ?? 'image/jpeg',
        );
      }

      const updates = buildProfileUpdate(userId, validation.data, resolvedAvatarUrl, new Date());
      await upsertProfile(updates);

      router.back();
    } catch (err) {
      if (err instanceof Error) Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerStyle: { backgroundColor: Colors.light.brand.purple.DEFAULT },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.content}>
        {/* Avatar */}
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

        {/* Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
        />

        {/* Bio */}
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about your walk with God..."
          multiline
        />

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
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

// ──────────────────────────────────────────────
// 4. STYLES
// ──────────────────────────────────────────────

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
  },
});
```

### What changed & why

| Concern | Before (Complected) | After (De-complected) |
|---|---|---|
| **Validation** | None — raw strings passed straight to Supabase | `ProfileFormSchema` (Zod) validates **before** any DB call; `validateProfileForm()` is a pure function you can unit-test in Node |
| **Avatar path generation** | Inline `${session.user.id}/${Math.random()}.${fileExt}` buried inside async handler | `buildAvatarPath(userId, uri, nonce)` — pure, deterministic when you inject the nonce |
| **Profile upsert payload** | Object literal assembled inside the save handler alongside DB + upload logic | `buildProfileUpdate()` — pure function, trivially assertable |
| **Data access** | Raw `supabase` calls scattered through the component | Thin repository functions (`fetchProfile`, `uploadAvatar`, `upsertProfile`) isolate all Supabase interaction; the component only calls them |
| **Error surface** | `if (!session?.user) throw new Error(...)` deep inside async functions | Guard clause at the top of `handleSave`; typed `Alert` at every catch boundary |
| **Security** | No input validation; unbounded string lengths | Zod enforces min/max length, alphanumeric-only username (prevents injection via display name), and max bio length |

> **Next step (when multi-file refactors are permitted):** Move the three pure functions into `packages/social-engine/src/profile.ts` and the repository helpers into `apps/mobile/repositories/profile.repo.ts`, leaving the component as pure orchestration + UI.