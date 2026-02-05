
// This file is used to isolate whether Babel is correctly replacing the environment variable.
// If Babel is working, the bundle will contain the string literal "app" (or absolute path).
// If Babel is NOT working, the bundle will still contain "process.env.EXPO_ROUTER_APP_ROOT".

console.log("🔨 TEST ENTRY POINT LOADED");
console.log("🔨 Raw process.env.EXPO_ROUTER_APP_ROOT:", process.env.EXPO_ROUTER_APP_ROOT);

// We also try to use the router entry to see if it resolves
try {
  console.log("🔨 Attempting to resolve expo-router/entry...");
  require('expo-router/entry');
} catch (e) {
  console.error("❌ Failed to resolve expo-router/entry:", e);
}
