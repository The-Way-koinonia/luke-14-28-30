import React, { useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Post } from '@the-way/social-engine';
import PostSkeleton from './PostSkeleton';
import SocialPostCard from './SocialPostCard';
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
    const isLiked = optimisticLikes[post.id]?.liked ?? post.is_liked ?? false;
    const currentCount = optimisticLikes[post.id]?.count ?? post.likes_count ?? 0;
    
    // 1. Optimistic Update
    const newLiked = !isLiked;
    const newCount = isLiked ? currentCount - 1 : currentCount + 1;

    setOptimisticLikes(prev => ({
      ...prev,
      [post.id]: { count: newCount, liked: newLiked }
    }));

    // 2. API Call (Mocked/TODO)
    // api.likePost(post.id).catch(() => revert());
    console.log(`Optimistically liked post ${post.id}: ${newLiked}`);
  };

  const renderItem = ({ item }: { item: Post }) => {
    const optimisticState = optimisticLikes[item.id];
    const likeCount = optimisticState ? optimisticState.count : (item.likes_count || 0);
    const isLiked = optimisticState ? optimisticState.liked : (item.is_liked || false);

    return (
      <SocialPostCard 
        post={item}
        isLiked={isLiked}
        likeCount={likeCount}
        onLike={() => handleLike(item)}
        onPress={() => onPressPost?.(item)}
      />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.brand.primary || '#6366f1'}/>
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
  }
});
