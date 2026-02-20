/**
 * Phase 1 Validation Script
 * Checks if all required files and configurations are in place
 */

import { existsSync } from 'fs';
import { join } from 'path';

const requiredFiles = [
  // Core files
  '.env.example',
  'src/lib/supabase.ts',
  'src/services/authService.ts',
  'src/services/profileService.ts',
  'src/services/index.ts',
  'src/hooks/useAuth.tsx',
  'src/utils/authHelpers.ts',
  'src/types/supabase.ts',
  
  // Documentation
  'BACKEND_SETUP.md',
  'PHASE1_SUMMARY.md',
  'QUICKSTART.md',
];

const optionalFiles = [
  '.env', // User should create this
];

console.log('🔍 Validating Phase 1 Implementation...\n');

let allValid = true;

// Check required files
console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const exists = existsSync(file);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  if (!exists) allValid = false;
});

console.log('\n📋 Checking optional files:');
optionalFiles.forEach(file => {
  const exists = existsSync(file);
  const status = exists ? '✅' : '⚠️';
  const message = exists ? file : `${file} (needs to be created by user)`;
  console.log(`${status} ${message}`);
});

// Check package.json for Supabase
console.log('\n📦 Checking dependencies:');
try {
  const packageJson = JSON.parse(
    await import('fs').then(fs => 
      fs.promises.readFile('package.json', 'utf-8')
    )
  );
  
  const hasSupabase = packageJson.dependencies['@supabase/supabase-js'];
  console.log(hasSupabase ? '✅ @supabase/supabase-js installed' : '❌ @supabase/supabase-js missing');
  if (!hasSupabase) allValid = false;
} catch (err) {
  console.log('❌ Could not read package.json');
  allValid = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ Phase 1 validation PASSED!');
  console.log('\nNext steps:');
  console.log('1. Create .env file with Supabase credentials');
  console.log('2. Set up profiles table in Supabase');
  console.log('3. Create test user');
  console.log('4. Run: npm run dev');
  console.log('\nSee QUICKSTART.md for detailed instructions.');
} else {
  console.log('❌ Phase 1 validation FAILED!');
  console.log('Some required files are missing.');
}
console.log('='.repeat(50));

process.exit(allValid ? 0 : 1);
