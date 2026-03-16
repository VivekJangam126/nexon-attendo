/**
 * Check Employee Face Registration Status in Database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const checkEmployeeFaceStatus = async () => {
  console.log('🔍 Checking Employee Face Registration Status...');
  
  try {
    // Get all employees with their face registration status
    const { data: employees, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, face_registered, face_registered_at, profile_photo_url')
      .eq('role', 'employee')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log('\n📋 Employee Face Registration Status:');
    console.log('=' .repeat(80));
    
    if (!employees || employees.length === 0) {
      console.log('No employees found.');
      return;
    }

    employees.forEach((employee, index) => {
      console.log(`\n${index + 1}. ${employee.full_name} (${employee.email})`);
      console.log(`   ID: ${employee.id}`);
      console.log(`   Face Registered: ${employee.face_registered ? '✅ YES' : '❌ NO'}`);
      console.log(`   Registration Date: ${employee.face_registered_at || 'Not set'}`);
      console.log(`   Profile Photo: ${employee.profile_photo_url ? '✅ YES' : '❌ NO'}`);
      
      if (employee.profile_photo_url && !employee.face_registered) {
        console.log('   ⚠️  HAS PHOTO BUT FACE NOT REGISTERED - This is the issue!');
      }
    });

    // Find employees with photos but no face registration
    const problematicEmployees = employees.filter(emp => 
      emp.profile_photo_url && !emp.face_registered
    );

    if (problematicEmployees.length > 0) {
      console.log('\n🚨 FOUND THE ISSUE:');
      console.log(`${problematicEmployees.length} employee(s) have photos but face_registered = false`);
      console.log('\nTo fix this, we need to:');
      console.log('1. Re-upload their photos through the system, OR');
      console.log('2. Manually update the face_registered flag in the database');
      
      console.log('\n🔧 Quick Fix SQL:');
      problematicEmployees.forEach(emp => {
        console.log(`UPDATE profiles SET face_registered = true, face_registered_at = NOW() WHERE id = '${emp.id}';`);
      });
    } else {
      console.log('\n✅ All employees with photos have face registration enabled.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

checkEmployeeFaceStatus();