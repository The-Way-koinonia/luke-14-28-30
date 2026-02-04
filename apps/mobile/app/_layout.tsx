import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { checkForDatabaseUpdates } from '@/services/database/updateChecker';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Debug: Log environment variables at runtime
    console.log('');
    console.log('📱 ===== APP RUNTIME =====');
    console.log('📱 EXPO_ROUTER_ABS_APP_ROOT:', process.env.EXPO_ROUTER_ABS_APP_ROOT);
    console.log('📱 EXPO_ROUTER_APP_ROOT:', process.env.EXPO_ROUTER_APP_ROOT);
    console.log('📱 EXPO_ROUTER_IMPORT_MODE:', process.env.EXPO_ROUTER_IMPORT_MODE);
    console.log('=========================');
    console.log('');
    
    // Check for database updates in background
    checkForDatabaseUpdates({ silent: true }).catch(err => {
        console.error('Startup update check failed:', err);
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
