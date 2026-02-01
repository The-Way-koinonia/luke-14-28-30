import { StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';

import { ThemedText as Text } from '@/components/themed-text';
import { ThemedView as View } from '@/components/themed-view';
import { checkForDatabaseUpdates } from '@/services/database/updateChecker';

export default function SettingsScreen() {
  const [checking, setChecking] = useState(false);

  const handleUpdateCheck = async () => {
    setChecking(true);
    try {
      await checkForDatabaseUpdates({ force: true, silent: false });
      Alert.alert('Success', 'Database check complete.');
    } catch (error) {
      Alert.alert('Error', 'Failed to check for updates.');
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database</Text>
        <Text style={styles.text}>Check for the latest definition corrections and data improvements.</Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleUpdateCheck}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Check for Updates</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  section: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(100,100,100,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    marginBottom: 20,
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#2f95dc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
