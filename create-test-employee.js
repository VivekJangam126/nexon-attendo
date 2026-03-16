/**
 * Create Test Employee for Face Verification Testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const createTestEmployee = async () => {
  console.log('👤 Creating Test Employee for Face Verification...');
  
  try {
    // Generate unique email to avoid conflicts
    const timestamp = Date.now();
    const testEmail = `testface${timestamp}@nexus.com`;
    const testPassword = 'test123';
    
    console.log('\n1. Creating Supabase Auth User...');
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Auth creation error:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Get the first active office
    const { data: office, error: officeError } = await supabase
      .from('offices')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (officeError || !office) {
      console.error('❌ No active office found:', officeError);
      return;
    }

    console.log('\n2. Creating Employee Profile...');
    
    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: testEmail,
        full_name: 'Test Face Employee',
        role: 'employee',
        status: 'active',
        office_location: office.id,
        office_name: office.name,
        designation: 'Test Engineer',
        employee_id: `EMP${timestamp}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      return;
    }

    console.log('✅ Employee profile created');

    console.log('\n🎉 Test Employee Created Successfully!');
    console.log('=' .repeat(50));
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('👤 Name: Test Face Employee');
    console.log('🏢 Office:', office.name);
    console.log('🆔 Employee ID:', `EMP${timestamp}`);
    console.log('🔗 User ID:', authData.user.id);

    console.log('\n📋 Next Steps:');
    console.log('1. Login as admin');
    console.log('2. Go to Employee Management');
    console.log('3. Find "Test Face Employee"');
    console.log('4. Upload a profile photo');
    console.log('5. Logout and login as test employee');
    console.log('6. Try marking attendance - should show face verification');

    console.log('\n🧪 Testing Commands:');
    console.log(`# Test face registration for this employee:`);
    console.log(`node debug-face-check.js # (update employee ID to: ${authData.user.id})`);
    
    console.log(`\n# Check employee in database:`);
    console.log(`SELECT full_name, email, face_registered, profile_photo_url FROM profiles WHERE id = '${authData.user.id}';`);

    return {
      userId: authData.user.id,
      email: testEmail,
      password: testPassword,
      name: 'Test Face Employee'
    };

  } catch (error) {
    console.error('❌ Error creating test employee:', error);
  }
};

createTestEmployee();