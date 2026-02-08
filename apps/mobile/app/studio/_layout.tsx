import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function StudioLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="create" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
