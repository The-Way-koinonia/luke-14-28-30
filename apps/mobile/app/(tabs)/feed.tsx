import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import { useSocialFeed } from '../../hooks/useSocialFeed';
import { SocialPostCard } from '../../components/SocialPostCard';
import { CreatePostModal } from '../../components/CreatePostModal';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function FeedScreen() {
  const { posts, loading, refresh } = useSocialFeed();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
          title: 'Community Feed',
          headerRight: () => (
              <TouchableOpacity onPress={() => setModalVisible(true)} style={{ marginRight: 16 }}>
                  <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
          )
      }} />

      {loading && posts.length === 0 ? (
          <View style={styles.center}>
              <ActivityIndicator size="large" />
          </View>
      ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SocialPostCard post={item} />}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No posts yet. Be the first to share! 🌿</Text>
                </View>
            }
            contentContainerStyle={styles.listContent}
          />
      )}

      {/* Floating Action Button (Alternative to Header Button) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <CreatePostModal 
        visible={isModalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
