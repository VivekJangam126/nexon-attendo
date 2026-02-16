/**
 * Database Diagnostic Script
 * Checks database connectivity and table access
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔍 Database Diagnostic\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Using anon key:', supabaseKey.substring(0, 20) + '...\n');

async function checkTable(tableName, description) {
  console.log(`\n📋 Checking ${description} (${tableName})...`);
  
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: false })
      .limit(1);
    
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      console.log(`  Details: ${error.details}`);
      console.log(`  Hint: ${error.hint}`);
      return false;
    }
    
    console.log(`  ✅ Table accessible`);
    console.log(`  📊 Sample data:`, data);
    return true;
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
    return false;
  }
}

async function checkAttendanceSettings() {
  console.log(`\n⚙️  Checking attendance_settings specifically...`);
  
  try {
    // Try without filters first
    const { data: all, error: allError } = await supabase
      .from('attendance_settings')
      .select('*');
    
    console.log('  Without filters:');
    if (allError) {
      console.log(`    ❌ Error: ${allError.message}`);
    } else {
      console.log(`    ✅ Found ${all?.length || 0} records`);
      if (all && all.length > 0) {
        console.log(`    📊 Records:`, JSON.stringify(all, null, 2));
      }
    }
    
    // Try with filters
    const { data: filtered, error: filteredError } = await supabase
      .from('attendance_settings')
      .select('*')
      .eq('setting_name', 'default_attendance_window')
      .eq('is_active', true);
    
    console.log('\n  With filters (setting_name=default_attendance_window, is_active=true):');
    if (filteredError) {
      console.log(`    ❌ Error: ${filteredError.message}`);
    } else {
      console.log(`    ✅ Found ${filtered?.length || 0} records`);
      if (filtered && filtered.length > 0) {
        console.log(`    📊 Records:`, JSON.stringify(filtered, null, 2));
      }
    }
    
    // Try with maybeSingle
    const { data: single, error: singleError } = await supabase
      .from('attendance_settings')
      .select('*')
      .eq('setting_name', 'default_attendance_window')
      .eq('is_active', true)
      .maybeSingle();
    
    console.log('\n  With maybeSingle():');
    if (singleError) {
      console.log(`    ❌ Error: ${singleError.message}`);
    } else if (!single) {
      console.log(`    ⚠️  No record found (null)`);
    } else {
      console.log(`    ✅ Found record`);
      console.log(`    📊 Data:`, JSON.stringify(single, null, 2));
    }
    
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
  }
}

async function runDiagnostics() {
  console.log('═'.repeat(60));
  
  await checkTable('profiles', 'Profiles table');
  await checkTable('offices', 'Offices table');
  await checkTable('attendance', 'Attendance table');
  await checkTable('attendance_settings', 'Attendance Settings table');
  
  await checkAttendanceSettings();
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Diagnostic complete\n');
}

runDiagnostics().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
