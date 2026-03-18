/**
 * Check Employee Profiles
 * See what profiles exist in the database
 */

console.log('🔍 Checking Employee Profiles in Database...');

async function checkEmployeeProfiles() {
  try {
    // Get the registered employee IDs from ML service
    console.log('\n📋 Step 1: Getting ML Service Registrations...');
    const mlResponse = await fetch('http://localhost:5000/debug');
    const mlData = await mlResponse.json();
    
    const mlEmployeeIds = mlData.storage_files
      .filter(f => f.endsWith('_features.pkl'))
      .map(f => f.replace('_features.pkl', ''))
      .filter(id => id !== 'new-employee-1773747484025');
    
    console.log('🤖 ML Service has faces for:');
    mlEmployeeIds.forEach(id => {
      console.log(`  - ${id}`);
    });
    
    // Check what profiles exist in database
    console.log('\n📋 Step 2: Checking Database Profiles...');
    
    // We'll use a simple API call to get profile info
    for (const employeeId of mlEmployeeIds) {
      console.log(`\n🔍 Checking profile for ${employeeId}...`);
      
      try {
        // Try to get profile info through a simple API call
        const profileResponse = await fetch(`http://localhost:8081/api/employees`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (profileResponse.ok) {
          const result = await profileResponse.json();
          const employees = result.data || [];
          const employee = employees.find(emp => emp.id === employeeId);
          
          if (employee) {
            console.log('  ✅ Profile found:');
            console.log(`    - Email: ${employee.email}`);
            console.log(`    - Name: ${employee.full_name}`);
            console.log(`    - Status: ${employee.status}`);
            console.log(`    - Role: ${employee.role}`);
            console.log(`    - Face Registered: ${employee.face_registered}`);
          } else {
            console.log('  ❌ No profile found in employees list');
          }
        } else {
          console.log('  ❌ Failed to get employees list');
        }
      } catch (error) {
        console.log('  ❌ Error checking profile:', error.message);
      }
    }
    
    console.log('\n📋 Step 3: Checking Recent Employees...');
    
    try {
      const employeesResponse = await fetch(`http://localhost:8081/api/employees`);
      if (employeesResponse.ok) {
        const result = await employeesResponse.json();
        const employees = result.data || [];
        console.log(`📊 Total employees in database: ${employees.length}`);
        
        // Show recent employees
        const recentEmployees = employees
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        
        console.log('\n👥 5 Most Recent Employees:');
        recentEmployees.forEach(emp => {
          console.log(`  - ${emp.email} (${emp.full_name}) - Status: ${emp.status} - Face: ${emp.face_registered ? '✅' : '❌'}`);
          console.log(`    ID: ${emp.id}`);
        });
      }
    } catch (error) {
      console.log('❌ Error getting employees:', error.message);
    }
    
    console.log('\n✅ Check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEmployeeProfiles().catch(console.error);