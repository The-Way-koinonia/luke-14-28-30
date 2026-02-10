#!/bin/bash

echo "🧹 Nuclear Clean - Clearing ALL caches..."

# 1. Node/Metro caches
echo "1️⃣ Clearing Node & Metro caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .expo-shared
rm -rf /tmp/metro-*
rm -rf /tmp/haste-map-*
rm -rf /tmp/react-*

# 2. Watchman cache (if installed)
echo "2️⃣ Clearing Watchman..."
if command -v watchman &> /dev/null; then
    watchman watch-del-all
    echo "✓ Watchman cleared"
else
    echo "⚠ Watchman not installed (skipping)"
fi

# 3. Global Expo cache
echo "3️⃣ Clearing global Expo cache..."
rm -rf ~/.expo/cache
rm -rf ~/.expo/packager-info.json

# 4. iOS Simulator cache (if on Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "4️⃣ Clearing iOS Simulator cache..."
    xcrun simctl shutdown all
    xcrun simctl erase all
    echo "✓ iOS Simulators reset"
fi

# 5. Gradle cache (for Android)
echo "5️⃣ Clearing Gradle cache..."
rm -rf ~/.gradle/caches

# 6. Clear any cached transforms
echo "6️⃣ Clearing babel transforms..."
rm -rf .babel-cache

echo ""
echo "✅ Nuclear clean complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm start"
echo "2. Press 'i' for iOS or 'a' for Android"
