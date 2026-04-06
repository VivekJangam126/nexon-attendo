/**
 * Pre-Deployment Validation Script
 * Run this before deploying to catch common issues
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const errors = [];
const warnings = [];

console.log('🔍 Running pre-deployment checks...\n');

// Check 1: Environment variables
console.log('1️⃣  Checking environment configuration...');
const envExamplePath = join(process.cwd(), '.env.example');
const envPath = join(process.cwd(), '.env');

if (!existsSync(envExamplePath)) {
  errors.push('.env.example file not found');
} else {
  const envExample = readFileSync(envExamplePath, 'utf-8');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'RESEND_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
  ];
  
  requiredVars.forEach(varName => {
    if (!envExample.includes(varName)) {
      warnings.push(`${varName} not found in .env.example`);
    }
  });
}

if (existsSync(envPath)) {
  warnings.push('.env file exists - ensure it is in .gitignore');
}

// Check 2: Package.json scripts
console.log('2️⃣  Checking package.json scripts...');
const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));

const requiredScripts = ['build', 'lint', 'test'];
requiredScripts.forEach(script => {
  if (!packageJson.scripts[script]) {
    warnings.push(`Missing script: ${script}`);
  }
});

// Check 3: Vercel configuration
console.log('3️⃣  Checking Vercel configuration...');
const vercelConfigPath = join(process.cwd(), 'vercel.json');
if (!existsSync(vercelConfigPath)) {
  errors.push('vercel.json not found - deployment may fail');
}

// Check 4: API endpoint
console.log('4️⃣  Checking API endpoint...');
const apiPath = join(process.cwd(), 'server', 'api', 'send-notification.ts');
if (!existsSync(apiPath)) {
  errors.push('API endpoint server/api/send-notification.ts not found');
}

// Check 5: TypeScript configuration
console.log('5️⃣  Checking TypeScript configuration...');
const tsconfigPath = join(process.cwd(), 'tsconfig.json');
if (!existsSync(tsconfigPath)) {
  errors.push('tsconfig.json not found');
}

// Check 6: Dependencies
console.log('6️⃣  Checking critical dependencies...');
const criticalDeps = [
  '@supabase/supabase-js',
  'react',
  'react-dom',
  'react-router-dom',
  'vite',
  'twilio',
  'resend'
];

criticalDeps.forEach(dep => {
  if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
    errors.push(`Missing dependency: ${dep}`);
  }
});

// Check 7: Build output
console.log('7️⃣  Checking build configuration...');
const viteConfigPath = join(process.cwd(), 'vite.config.ts');
if (!existsSync(viteConfigPath)) {
  errors.push('vite.config.ts not found');
}

// Check 8: Git ignore
console.log('8️⃣  Checking .gitignore...');
const gitignorePath = join(process.cwd(), '.gitignore');
if (existsSync(gitignorePath)) {
  const gitignore = readFileSync(gitignorePath, 'utf-8');
  const criticalIgnores = ['.env', 'node_modules', 'dist'];
  
  criticalIgnores.forEach(pattern => {
    if (!gitignore.includes(pattern)) {
      errors.push(`${pattern} not in .gitignore`);
    }
  });
} else {
  errors.push('.gitignore not found');
}

// Results
console.log('\n' + '='.repeat(50));
console.log('📊 Pre-Deployment Check Results\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Ready to deploy.\n');
  process.exit(0);
}

if (errors.length > 0) {
  console.log('❌ ERRORS (must fix before deploying):');
  errors.forEach(error => console.log(`   - ${error}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (review before deploying):');
  warnings.forEach(warning => console.log(`   - ${warning}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Deployment blocked due to errors.\n');
  process.exit(1);
} else {
  console.log('⚠️  Warnings found but deployment can proceed.\n');
  process.exit(0);
}
