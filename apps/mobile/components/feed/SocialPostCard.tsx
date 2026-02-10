import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Post } from '@the-way/social-engine';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import VideoPreview from './VideoPreview';
import VerseQuote from './VerseQuote';
import VisualRepost from './VisualRepost';

interface SocialPostCardProps {
  post: Post;
  isLiked?: boolean;
  likeCount?: number;
  onLike?: () => void;
  onPress?: () => void;
}

export default function SocialPostCard({ post, isLiked, likeCount, onLike, onPress }: SocialPostCardProps) {
  
  // Display priority: specific media type logic
  const renderMedia = () => {
    if (post.media_type === 'video' && post.media_url) {
      return <VideoPreview uri={post.media_url} />;
    }
    // if (post.media_type === 'audio') return <AudioPlayer ... />
    
    // Check for Quoted Post (Repost)
    if (post.quoted_post) {
        return <VisualRepost post={post.quoted_post} />;
    }

    // Check for Verse (Custom logic or if content implies)
    // For now assuming verse_reference might be passed in post object if expanded
    // if (post.verse_reference) return <VerseQuote ... />
    
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
            source={{ uri: post.user?.avatar_url || 'https://i.pravatar.cc/150' }} 
            style={styles.avatar} 
        />
        <View>
             {/* Fallback to username if full_name missing */}
            <Text style={styles.name}>{post.user?.username || 'Unknown User'}</Text>
            <Text style={styles.username}>@{post.user?.username}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>
      
      {/* Media Attachments */}
      {renderMedia()}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onLike} style={styles.actionButton}>
            <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color={isLiked ? (Colors.light.brand.primary || 'red') : "#6b7280"} 
            />
            <Text style={[styles.actionText, isLiked && styles.likedText]}> {likeCount ?? 0}</Text>
        </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
            <Text style={styles.actionText}> Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="repeat-outline" size={20} color="#6b7280" />
            <Text style={styles.actionText}> Repost</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
      justifyContent: 'space-between',
      marginTop: 12,
      paddingRight: 12,
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
      color: Colors.light.brand.primary || 'red',
      fontWeight: 'bold',
  }
});
