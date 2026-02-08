import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MenuScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.brand.gold.DEFAULT, Colors.light.brand.purple.DEFAULT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      />
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Menu</Text>
        <View style={styles.content}>
            <Text>Settings and additional options.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  safeArea: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', padding: 16 },
  content: { padding: 16 },
});
