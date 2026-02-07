import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  displayName: string;
  username: string; // e.g. @colin
  avatarUrl?: string;
  bannerUrl?: string;
  stats: { posts: number; followers: number; following: number };
  onEditProfile?: () => void;
}

export default function ProfileHeader({
  displayName,
  username,
  avatarUrl,
  bannerUrl,
  stats,
  onEditProfile,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.banner} resizeMode="cover" />
        ) : (
            <View style={[styles.banner, styles.bannerPlaceholder]} />
        )}
      </View>

      <View style={styles.content}>
        {/* Header Top Row: Avatar and Edit Button */}
        <View style={styles.headerRow}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={40} color="#666" />
                    </View>
                )}
            </View>
            
            {/* Edit Button */}
            <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.username}>{username}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
            </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bannerContainer: {
    height: 120, // h-32 (32 * 4 = 128, approx 120)
    width: '100%',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    backgroundColor: '#cbd5e1', // slate-300
  },
  content: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -40, // Negative margin to overlap banner
    marginBottom: 12,
  },
  avatarContainer: {
    padding: 4,
    backgroundColor: '#fff', // border-white
    borderRadius: 50, // rounded-full
  },
  avatar: {
    width: 80, // w-20
    height: 80, // h-20
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#e2e8f0', // slate-200
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#d4d4d4', // neutral-300
    borderRadius: 20, // pill-shaped
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 10, // Align with bottom of avatar visually
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717', // neutral-900
  },
  userInfo: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#171717',
  },
  username: {
    fontSize: 14,
    color: '#525252', // neutral-600
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#171717',
  },
  statLabel: {
    fontSize: 12,
    color: '#737373', // neutral-500
  },
});
