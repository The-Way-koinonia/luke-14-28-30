import React from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { SocialPostCard } from '@/components/SocialPostCard';
import { Ionicons } from '@expo/vector-icons';
import { useSocialFeed } from '@the-way/social-engine';
import { MobileSocialAdapter } from '@/utils/mobileSocialAdapter';

export default function FeedScreen() {
  const { posts, loading, refresh, loadMore } = useSocialFeed(MobileSocialAdapter);

  return (
    <View style={styles.container}>
      {/* Hide Default Header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Gradient Header Background */}
      <LinearGradient
        colors={[Colors.light.brand.gold.DEFAULT, Colors.light.brand.purple.DEFAULT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Content */}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>The Way</Text>
          <TouchableOpacity onPress={refresh}>
             <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Feed List */}
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SocialPostCard post={item} />}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={refresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                {loading ? (
                    <ActivityIndicator color={Colors.light.brand.purple.DEFAULT} />
                ) : (
                    <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
                )}
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120, // Covers the top area
  },
  safeArea: {
    flex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'serif', // Or your custom font
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 80,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
});
