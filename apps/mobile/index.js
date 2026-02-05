
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Manually create the require.context pointing to the app directory
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
