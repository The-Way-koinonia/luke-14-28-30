const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// Set EXPO_ROUTER_ABS_APP_ROOT for the Metro bundler process
const absAppRoot = path.join(projectRoot, 'app');
process.env.EXPO_ROUTER_ABS_APP_ROOT = absAppRoot;

console.log('');
console.log('🔧 ===== METRO CONFIG =====');
console.log('📁 Project Root:', projectRoot);
console.log('📁 Workspace Root:', workspaceRoot);
console.log('📁 EXPO_ROUTER_ABS_APP_ROOT:', process.env.EXPO_ROUTER_ABS_APP_ROOT);
console.log('📁 EXPO_ROUTER_APP_ROOT:', process.env.EXPO_ROUTER_APP_ROOT);
console.log('📁 EXPO_ROUTER_IMPORT_MODE:', process.env.EXPO_ROUTER_IMPORT_MODE);
console.log('==========================');
console.log('');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

config.resolver.extraNodeModules = {
  'react': path.resolve(workspaceRoot, 'node_modules/react'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  'expo': path.resolve(workspaceRoot, 'node_modules/expo'),
};

config.resolver.assetExts.push('db');

module.exports = config;
