import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import ProfileHeader from '@/components/ProfileHeader';
import { SocialPostCard } from '@/components/SocialPostCard';
import ComposePostModal from '@/components/ComposePostModal';
import { Post } from '@/types/social';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposeVisible, setComposeVisible] = useState(false);

  // Mock stats for now
  const stats = {
    posts: posts.length,
    followers: 120,
    following: 45,
  };

  const fetchUserPosts = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPosts(data as Post[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserPosts();
  }, [session]);

  if (!session) {
      return (
          <View style={styles.center}>
              <Text>Please log in to view your profile.</Text>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SocialPostCard post={item} />}
        ListHeaderComponent={
            <ProfileHeader
                displayName={session.user.email?.split('@')[0] || 'User'}
                username={`@${session.user.email?.split('@')[0] || 'user'}`}
                stats={stats}
                onEditProfile={() => console.log('Edit profile')}
            />
        }
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchUserPosts}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>You haven't posted yet.</Text>
            </View>
        }
      />

      {/* FAB for composing */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setComposeVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <ComposePostModal
        visible={isComposeVisible}
        onClose={() => setComposeVisible(false)}
        onPostSuccess={fetchUserPosts}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF', // brand-blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
