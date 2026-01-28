import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Post } from '../types/social';
import { getVerseText } from '../utils/bibleDb';
import { Ionicons } from '@expo/vector-icons';

interface SocialPostCardProps {
  post: Post;
}

export const SocialPostCard: React.FC<SocialPostCardProps> = ({ post }) => {
  const [verseText, setVerseText] = useState<string | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchVerse = async () => {
      if (post.verse_ref) {
        setLoadingVerse(true);
        const text = await getVerseText(post.verse_ref);
        if (isMounted) {
          setVerseText(text);
          setLoadingVerse(false);
        }
      } else {
         setLoadingVerse(false);
      }
    };

    fetchVerse();
    
    return () => { isMounted = false; };
  }, [post.verse_ref]);

  return (
    <View style={styles.card}>
      {/* Header: User Info */}
      <View style={styles.header}>
        <View style={styles.avatar}>
             <Ionicons name="person" size={20} color="#666" />
        </View>
        <View style={styles.headerText}>
             <Text style={styles.username}>User {post.user_id.slice(0,8)}</Text>
             <Text style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.visibilityBadge}>
            <Ionicons 
                name={post.visibility === 'public' ? 'globe' : post.visibility === 'friends' ? 'people' : 'lock-closed'} 
                size={12} 
                color="#888" 
            />
            <Text style={styles.visibilityText}>{post.visibility}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Bible Verse Section (The "Bridge" Architecture) */}
      <View style={styles.verseContainer}>
        <View style={styles.verseHeader}>
            <Ionicons name="book-outline" size={16} color="#4A90E2" />
            <Text style={styles.verseRef}>{post.verse_ref}</Text>
        </View>
        
        {loadingVerse ? (
            <View style={styles.skeletonContainer}>
                <View style={[styles.skeletonLine, { width: '90%' }]} />
                <View style={[styles.skeletonLine, { width: '70%' }]} />
            </View>
        ) : (
            <Text style={styles.verseText}>
                {verseText || "Verse text unavailable offline."}
            </Text>
        )}
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
         <Ionicons name="heart-outline" size={24} color="#333" />
         <Ionicons name="chatbubble-outline" size={24} color="#333" />
         <Ionicons name="share-outline" size={24} color="#333" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  visibilityText: {
    fontSize: 10,
    color: '#888',
    textTransform: 'capitalize',
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 16,
  },
  verseContainer: {
    backgroundColor: '#f8fbff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  verseRef: {
    fontWeight: 'bold',
    color: '#4A90E2',
    fontSize: 14,
  },
  verseText: {
    fontStyle: 'italic',
    color: '#555',
    lineHeight: 20,
  },
  skeletonContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#e1e9ee',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
});
