// - Lets the app import ../shared (disease content shared with the backend).
// - Bundles .tflite files as assets for on-device inference.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../shared')];
config.resolver.assetExts.push('tflite');

module.exports = config;
