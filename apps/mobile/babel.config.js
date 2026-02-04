module.exports = function (api) {
  api.cache(false);
  
  const path = require('path');
  const projectRoot = __dirname;
  
  // FORCE these to correct values BEFORE babel-preset-expo can override them
  process.env.EXPO_ROUTER_ABS_APP_ROOT = path.join(projectRoot, 'app');
  process.env.EXPO_ROUTER_APP_ROOT = 'app'; // MUST be relative!
  
  console.log('');
  console.log('🔨 ===== BABEL CONFIG =====');
  console.log('🔨 EXPO_ROUTER_ABS_APP_ROOT:', process.env.EXPO_ROUTER_ABS_APP_ROOT);
  console.log('🔨 EXPO_ROUTER_APP_ROOT:', process.env.EXPO_ROUTER_APP_ROOT);
  console.log('🔨 EXPO_ROUTER_IMPORT_MODE:', process.env.EXPO_ROUTER_IMPORT_MODE);
  console.log('==========================');
  console.log('');
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};