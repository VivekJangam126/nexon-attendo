/**
 * Debug Employee Face Status
 * Check database vs ML service registration status
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmployeeFaceStatus() {
  console.log('🔍 Checking Employee Face Status...');
  
  const employeeId = '10bc0a21-ddf5-464d-a8c0-24163dfc9eea';
  
  try {
    // Check database profile
    console.log('\n📋 Step 1: Checking Database Profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, face_registered, face_registered_at, status')
      .eq('id', employeeId)
      .single();
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
    } else if (profile) {
      console.log('👤 Profile found:');
      console.log('  - ID:', profile.id);
      console.log('  - Email:', profile.email);
      console.log('  - Name:', profile.full_name);
      console.log('  - Face Registered:', profile.face_registered);
      console.log('  - Face Registered At:', profile.face_registered_at);
      console.log('  - Status:', profile.status);
    } else {
      console.log('❌ No profile found for ID:', employeeId);
    }
    
    // Check all profiles with face_registered = true
    console.log('\n📋 Step 2: Checking All Face-Registered Profiles...');
    const { data: faceProfiles, error: faceError } = await supabase
      .from('profiles')
      .select('id, email, full_name, face_registered, status')
      .eq('face_registered', true);
    
    if (faceError) {
      console.log('❌ Face profiles error:', faceError.message);
    } else {
      console.log(`📊 Found ${faceProfiles?.length || 0} profiles with face_registered = true:`);
      faceProfiles?.forEach(p => {
        console.log(`  - ${p.id} (${p.email}) - Status: ${p.status}`);
      });
    }
    
    // Check the most recent approved employee
    console.log('\n📋 Step 3: Checking Most Recent Approved Employee...');
    const { data: recentEmployee, error: recentError } = await supabase
      .from('profiles')
      .select('id, email, full_name, face_registered, status, created_at')
      .eq('status', 'active')
      .eq('role', 'employee')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (recentError) {
      console.log('❌ Recent employee error:', recentError.message);
    } else if (recentEmployee) {
      console.log('👤 Most recent approved employee:');
      console.log('  - ID:', recentEmployee.id);
      console.log('  - Email:', recentEmployee.email);
      console.log('  - Name:', recentEmployee.full_name);
      console.log('  - Face Registered:', recentEmployee.face_registered);
      console.log('  - Status:', recentEmployee.status);
      console.log('  - Created At:', recentEmployee.created_at);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEmployeeFaceStatus().catch(console.error);