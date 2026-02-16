/**
 * Insert Default Attendance Settings
 * Creates the default attendance window record in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertDefaultSettings() {
  console.log('\n🔧 Inserting default attendance settings...\n');
  
  const defaultSettings = {
    setting_name: 'default_attendance_window',
    start_time: '09:00:00',
    end_time: '18:00:00',
    grace_period_minutes: 30,
    strict_mode: true,
    is_active: true,
  };
  
  console.log('Settings to insert:');
  console.log(JSON.stringify(defaultSettings, null, 2));
  console.log('');
  
  try {
    // Try to insert
    const { data, error } = await supabase
      .from('attendance_settings')
      .insert(defaultSettings)
      .select()
      .single();
    
    if (error) {
      // If conflict, try to update
      if (error.code === '23505') {
        console.log('⚠️  Record already exists, updating...\n');
        
        const { data: updateData, error: updateError } = await supabase
          .from('attendance_settings')
          .update({
            start_time: defaultSettings.start_time,
            end_time: defaultSettings.end_time,
            grace_period_minutes: defaultSettings.grace_period_minutes,
            strict_mode: defaultSettings.strict_mode,
            is_active: defaultSettings.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_name', 'default_attendance_window')
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Update failed:', updateError.message);
          console.error('Details:', updateError);
          process.exit(1);
        }
        
        console.log('✅ Settings updated successfully!');
        console.log('\nUpdated record:');
        console.log(JSON.stringify(updateData, null, 2));
      } else {
        console.error('❌ Insert failed:', error.message);
        console.error('Code:', error.code);
        console.error('Details:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ Settings inserted successfully!');
      console.log('\nInserted record:');
      console.log(JSON.stringify(data, null, 2));
    }
    
    console.log('\n✅ Done! Run "npm run diagnose" to verify.\n');
    
  } catch (err) {
    console.error('❌ Exception:', err.message);
    console.error(err);
    process.exit(1);
  }
}

insertDefaultSettings();
