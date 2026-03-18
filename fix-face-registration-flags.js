/**
 * Fix Face Registration Flags
 * Update database to match ML service registrations
 */

console.log('🔧 Fixing Face Registration Database Flags...');

async function fixFaceRegistrationFlags() {
  try {
    // Get the registered employee IDs from ML service
    console.log('\n📋 Step 1: Getting ML Service Registrations...');
    const mlResponse = await fetch('http://localhost:5000/debug');
    const mlData = await mlResponse.json();
    
    const employeeIds = mlData.storage_files
      .filter(f => f.endsWith('_features.pkl'))
      .map(f => f.replace('_features.pkl', ''))
      .filter(id => id !== 'new-employee-1773747484025'); // Skip test employee
    
    console.log('🤖 Found registered employee IDs in ML service:');
    employeeIds.forEach(id => {
      console.log(`  - ${id}`);
    });
    
    // Update database flags using the new sync API
    console.log('\n📋 Step 2: Syncing Database Flags...');
    
    const syncResponse = await fetch('http://localhost:8081/api/face-recognition/sync-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_ids: employeeIds
      }),
    });
    
    const syncResult = await syncResponse.json();
    
    if (syncResponse.ok) {
      console.log('✅ Sync successful:', syncResult.message);
      if (syncResult.updated_employees) {
        console.log('📊 Updated employees:');
        syncResult.updated_employees.forEach(emp => {
          console.log(`  - ${emp.email} (${emp.full_name})`);
        });
      }
    } else {
      console.log('❌ Sync failed:', syncResult.message);
      return;
    }
    
    // Test the fix
    console.log('\n📋 Step 3: Testing the Fix...');
    
    for (const employeeId of employeeIds.slice(0, 2)) { // Test first 2
      console.log(`\n🔍 Testing ${employeeId}...`);
      
      const checkResponse = await fetch('http://localhost:8081/api/face-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-registration',
          employee_id: employeeId,
        }),
      });
      
      const checkData = await checkResponse.json();
      console.log('  📊 Result:', checkData.registered ? '✅ Registered' : '❌ Not registered');
      if (checkData.registered) {
        console.log('  📝 Message:', checkData.message);
      }
    }
    
    console.log('\n✅ Fix completed!');
    console.log('\n💡 Next steps:');
    console.log('1. The approved employee should now be able to verify their face');
    console.log('2. Test face verification in the app');
    console.log('3. If still failing, check if the correct employee ID is being used');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixFaceRegistrationFlags().catch(console.error);