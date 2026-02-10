import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Post } from '@the-way/social-engine';
import PostSkeleton from './PostSkeleton';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface SmartFeedProps {
  data: Post[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onPressPost?: (post: Post) => void;
}

export default function SmartFeedList({ 
  data, 
  loading = false, 
  refreshing = false, 
  onRefresh, 
  onEndReached,
  onPressPost 
}: SmartFeedProps) {
  
  // Optimistic UI State
  // Map<PostId, OptimisticLikeState>
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, { count: number, liked: boolean }>>({});

  const handleLike = (post: Post) => {
    const isLiked = optimisticLikes[post.id]?.liked ?? false; // Default false for now
    const currentCount = optimisticLikes[post.id]?.count ?? post.likes;
    
    // 1. Optimistic Update
    const newLiked = !isLiked;
    const newCount = isLiked ? currentCount - 1 : currentCount + 1;

    setOptimisticLikes(prev => ({
      ...prev,
      [post.id]: { count: newCount, liked: newLiked }
    }));

    // 2. API Call (Mocked)
    // api.likePost(post.id).catch(() => revert());
    console.log(`Optimistically liked post ${post.id}: ${newLiked}`);
  };

  const renderItem = ({ item }: { item: Post }) => {
    const optimisticState = optimisticLikes[item.id];
    const likeCount = optimisticState ? optimisticState.count : item.likes;
    const isLiked = optimisticState ? optimisticState.liked : false;

    return (
      <View style={styles.postContainer}>
        {/* Header */}
        <View style={styles.header}>
            <View style={styles.avatar} />
            <View>
                <Text style={styles.name}>{item.user?.full_name}</Text>
                <Text style={styles.username}>@{item.user?.username}</Text>
            </View>
        </View>

        {/* Content */}
        <Text style={styles.content}>{item.content}</Text>
        
        {/* Actions (Optimistic Like) */}
        <View style={styles.actions}>
            <Text onPress={() => handleLike(item)} style={styles.actionButton}>
                <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={20} 
                    color={isLiked ? Colors.light.brand.primary : "#6b7280"} 
                />
                <Text style={[styles.actionText, isLiked && styles.likedText]}> {likeCount}</Text>
            </Text>
             <Text style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
                <Text style={styles.actionText}> Comment</Text>
            </Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing && data.length === 0) {
     return (
         <View style={styles.skeletonContainer}>
             <PostSkeleton />
             <PostSkeleton />
             <PostSkeleton />
             <PostSkeleton />
             <PostSkeleton />
         </View>
     )
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={data}
        renderItem={renderItem}
        estimatedItemSize={150}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.brand.primary}/>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6', 
  },
  skeletonContainer: {
      flex: 1,
      backgroundColor: '#f3f4f6',
  },
  postContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth:1, 
    borderBottomColor: '#e5e7eb'
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
  },
  avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#e5e7eb',
      marginRight: 12,
  },
  name: {
      fontWeight: 'bold',
      fontSize: 16,
  },
  username: {
      color: '#6b7280',
      fontSize: 14,
  },
  content: {
      fontSize: 16,
      lineHeight: 24,
      color: '#1f2937',
      marginBottom: 12,
  },
  actions: {
      flexDirection: 'row',
      gap: 24,
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  actionText: {
      color: '#6b7280',
      fontSize: 14,
      marginLeft: 4,
  },
  likedText: {
      color: Colors.light.brand.primary,
      fontWeight: 'bold',
  }
});
