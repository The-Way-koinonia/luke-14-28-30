const path = require('path');

// Ensure ABS_APP_ROOT is available for the inline transformation
process.env.EXPO_ROUTER_ABS_APP_ROOT = path.resolve(__dirname, 'app');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      ['transform-inline-environment-variables', {
        include: ['EXPO_ROUTER_APP_ROOT', 'EXPO_ROUTER_IMPORT_MODE', 'EXPO_ROUTER_ABS_APP_ROOT']
      }]
    ],
  };
};
