import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityScreen() {
  const groups = [
    { id: 1, name: 'Bible Study Group', members: 128 },
    { id: 2, name: 'Worship Team', members: 45 },
    { id: 3, name: 'Prayer Warriors', members: 312 },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Gradient Header Background */}
      <LinearGradient
        colors={[Colors.light.brand.gold.DEFAULT, Colors.light.brand.purple.DEFAULT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Community</Text>
          <TouchableOpacity>
             <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>Your Groups</Text>
            {groups.map(group => (
                <TouchableOpacity key={group.id} style={styles.groupCard}>
                    <View style={styles.groupIcon}>
                        <Ionicons name="people" size={24} color="white" />
                    </View>
                    <View>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={styles.groupMembers}>{group.members} members</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Events</Text>
            <View style={styles.eventCard}>
                <Text style={styles.eventName}>Sunday Service</Text>
                <Text style={styles.eventTime}>Sunday, 10:00 AM</Text>
            </View>
        </ScrollView>
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
    height: 120, 
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
  },
  content: {
      padding: 16,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 10,
      marginTop: 20,
  },
  groupCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
      padding: 16,
      borderRadius: 12,
      marginBottom: 10,
  },
  groupIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.light.brand.purple.DEFAULT,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  groupName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
  },
  groupMembers: {
      fontSize: 12,
      color: '#666',
  },
  eventCard: {
      backgroundColor: '#f0f0f0',
      padding: 16,
      borderRadius: 12,
  },
  eventName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
  },
  eventTime: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
  },
});
