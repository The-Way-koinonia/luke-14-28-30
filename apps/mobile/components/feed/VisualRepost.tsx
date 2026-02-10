import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Post } from '@the-way/social-engine';
import { Colors } from '@/constants/theme'; // Adjust import based on theme location
import VideoPreview from './VideoPreview';
import VerseQuote from './VerseQuote';

interface VisualRepostProps {
  post: Post;
}

export default function VisualRepost({ post }: VisualRepostProps) {
  return (
    <View style={styles.container}>
      {/* Mini Header */}
      <View style={styles.header}>
        <Image 
            source={{ uri: post.user?.avatar_url || 'https://i.pravatar.cc/150' }} 
            style={styles.avatar} 
        />
        <Text style={styles.name}>{post.user?.username}</Text>
      </View>

      {/* Content */}
      <Text style={styles.content} numberOfLines={3}>{post.content}</Text>

      {/* Nested Media - Only show one level deep */}
      {post.media_type === 'video' && post.media_url && (
          <VideoPreview uri={post.media_url} />
      )}
      
       {/* Verse stub - if post has verse ref */}
       {/* Not implementing recursive reposts to avoid infinity */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#e5e7eb',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#374151',
  },
  content: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  }
});
