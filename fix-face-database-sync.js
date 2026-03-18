/**
 * Fix Face Database Sync
 * Manually sync face registration flags between ML service and database
 */

console.log('🔧 Fixing Face Database Sync...');

async function fixFaceDatabaseSync() {
  try {
    // Get face registrations from ML service
    console.log('\n📋 Step 1: Getting ML Service Face Registrations...');
    const mlResponse = await fetch('http://localhost:5000/debug');
    const mlData = await mlResponse.json();
    
    const faceIds = mlData.storage_files
      .filter(f => f.endsWith('_features.pkl'))
      .map(f => f.replace('_features.pkl', ''))
      .filter(id => id !== 'new-employee-1773747484025'); // Skip test employee
    
    console.log('🤖 Face IDs in ML Service:');
    faceIds.forEach(id => console.log(`  - ${id}`));
    
    // Get all employees from database
    console.log('\n📋 Step 2: Getting Database Employees...');
    const employeesResponse = await fetch('http://localhost:8081/api/employees');
    const employeesResult = await employeesResponse.json();
    const employees = employeesResult.data || [];
    
    console.log(`📊 Found ${employees.length} employees in database`);
    
    // Find matching employees
    const matchingEmployees = employees.filter(emp => faceIds.includes(emp.id));
    console.log(`🔍 Found ${matchingEmployees.length} employees with face data:`);
    matchingEmployees.forEach(emp => {
      console.log(`  - ${emp.email} (${emp.full_name}) - Status: ${emp.status} - Face: ${emp.face_registered ? '✅' : '❌'}`);
    });
    
    // Update face_registered flag for matching employees
    if (matchingEmployees.length > 0) {
      console.log('\n📋 Step 3: Updating Face Registration Flags...');
      
      const updateIds = matchingEmployees.map(emp => emp.id);
      
      const syncResponse = await fetch('http://localhost:8081/api/face-recognition/sync-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_ids: updateIds
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
      console.log('\n📋 Step 4: Testing Face Registration Check...');
      
      for (const employee of matchingEmployees.slice(0, 2)) {
        console.log(`\n🔍 Testing ${employee.email}...`);
        
        const checkResponse = await fetch('http://localhost:8081/api/face-recognition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check-registration',
            employee_id: employee.id,
          }),
        });
        
        const checkData = await checkResponse.json();
        console.log('  📊 Result:', checkData.registered ? '✅ Registered' : '❌ Not registered');
        if (checkData.registered) {
          console.log('  📝 Message:', checkData.message);
        }
      }
    }
    
    console.log('\n✅ Fix completed!');
    console.log('\n💡 Next steps:');
    console.log('1. The approved employee should now be able to verify their face');
    console.log('2. Test face verification in the app');
    console.log('3. If still failing, check the employee ID being used in verification');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixFaceDatabaseSync().catch(console.error);