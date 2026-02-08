const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// ✅ Tell Metro where the router root is
const config = getDefaultConfig(projectRoot, {
  routerRoot: 'app',
});

// ✅ Enable require.context for expo-router
config.transformer.unstable_allowRequireContext = true;

console.log('');
console.log('🔧 ===== METRO CONFIG =====');
console.log('📁 Project Root:', projectRoot);
console.log('📁 Workspace Root:', workspaceRoot);
console.log('==========================');
console.log('');

config.watchFolders = [
  workspaceRoot,
  path.resolve(workspaceRoot, 'packages')
];
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