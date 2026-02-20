#!/usr/bin/env node

/**
 * Helper script to switch between app versions for testing
 * Usage: node switch-app-version.js [minimal|debug|full]
 */

const fs = require('fs');
const path = require('path');

const versions = {
  minimal: './App-minimal',
  debug: './App-debug',
  full: './App',
};

const version = process.argv[2];

if (!version || !versions[version]) {
  console.log('❌ Invalid version specified\n');
  console.log('Usage: node switch-app-version.js [minimal|debug|full]\n');
  console.log('Available versions:');
  console.log('  minimal - Basic React Native test (no dependencies)');
  console.log('  debug   - Module dependency test (shows which module fails)');
  console.log('  full    - Complete app with lazy loading (production)\n');
  console.log('Example: node switch-app-version.js minimal');
  process.exit(1);
}

const indexPath = path.join(__dirname, 'index.js');
const importLine = `import App from '${versions[version]}';`;

try {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Replace the import line
  content = content.replace(
    /import App from '\.\/App[^']*';/,
    importLine
  );
  
  fs.writeFileSync(indexPath, content, 'utf8');
  
  console.log(`✅ Switched to ${version} version`);
  console.log(`📝 Updated index.js: ${importLine}\n`);
  console.log('Next steps:');
  console.log('  1. Run: npm start');
  console.log('  2. Press "a" for Android or scan QR code');
  console.log('  3. Check the app behavior\n');
  
  if (version === 'minimal') {
    console.log('Expected: Blue screen with "✅ App Loaded Successfully!"');
  } else if (version === 'debug') {
    console.log('Expected: List of modules with ✅ or ❌ status');
  } else {
    console.log('Expected: Loading screen → Login screen');
  }
  
} catch (error) {
  console.error('❌ Error updating index.js:', error.message);
  process.exit(1);
}
