/**
 * Fix Face Registration for Employees with Photos
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const fixFaceRegistration = async () => {
  console.log('🔧 Fixing Face Registration for Employees with Photos...');
  
  try {
    // Update employees who have photos to enable face registration
    const { data: updatedEmployees, error: updateError } = await supabase
      .from('profiles')
      .update({
        face_registered: true,
        face_registered_at: new Date().toISOString()
      })
      .eq('role', 'employee')
      .eq('face_registered', false)
      .not('profile_photo_url', 'is', null)
      .neq('profile_photo_url', '')
      .select('id, full_name, email');

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return;
    }

    console.log(`✅ Updated ${updatedEmployees?.length || 0} employees`);
    
    if (updatedEmployees && updatedEmployees.length > 0) {
      console.log('\n📋 Updated Employees:');
      updatedEmployees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.full_name} (${emp.email})`);
      });
    }

    // Verify the fix by checking the specific employees
    console.log('\n🔍 Verifying the fix...');
    const { data: verifyEmployees, error: verifyError } = await supabase
      .from('profiles')
      .select('full_name, email, face_registered, face_registered_at, profile_photo_url')
      .eq('role', 'employee')
      .not('profile_photo_url', 'is', null)
      .neq('profile_photo_url', '')
      .order('face_registered_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Verify error:', verifyError);
      return;
    }

    console.log('\n📋 Employees with Photos (After Fix):');
    console.log('=' .repeat(60));
    
    verifyEmployees?.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.full_name} (${emp.email})`);
      console.log(`   Face Registered: ${emp.face_registered ? '✅ YES' : '❌ NO'}`);
      console.log(`   Registration Date: ${emp.face_registered_at || 'Not set'}`);
      console.log('');
    });

    console.log('✅ Face registration fix completed!');
    console.log('\n🧪 Now test the attendance flow:');
    console.log('1. Login as dattu@nexus.com or harish@nexus.com');
    console.log('2. Click "Mark Attendance"');
    console.log('3. You should now see the face verification modal');
    console.log('4. Take a selfie and verify face recognition works');

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

fixFaceRegistration();