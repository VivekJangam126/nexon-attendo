/**
 * Debug Current User Face Registration
 * Check what employee ID is being used vs what's registered
 */

console.log('🔍 Debugging Current User Face Registration...');

// Test the face registration check API directly
async function testCurrentUserFaceCheck() {
  try {
    console.log('\n📋 Step 1: Testing Face Registration Check API...');
    
    // First, let's see what employee IDs are registered in ML service
    const mlResponse = await fetch('http://localhost:5000/debug');
    const mlData = await mlResponse.json();
    
    console.log('🤖 ML Service Registered IDs:');
    const employeeIds = mlData.storage_files
      .filter(f => f.endsWith('_features.pkl'))
      .map(f => f.replace('_features.pkl', ''));
    
    employeeIds.forEach(id => {
      console.log(`  - ${id}`);
    });
    
    // Test each registered ID through our API
    console.log('\n📋 Step 2: Testing Each ID Through Our API...');
    
    for (const employeeId of employeeIds) {
      console.log(`\n🔍 Testing ID: ${employeeId}`);
      
      const checkResponse = await fetch('http://localhost:8081/api/face-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-registration',
          employee_id: employeeId,
        }),
      });
      
      const checkData = await checkResponse.json();
      console.log('  📊 API Response:', checkData);
    }
    
    console.log('\n✅ Debug completed!');
    console.log('\n💡 Analysis:');
    console.log('- If ML service has faces but API says "not registered", there\'s a database mismatch');
    console.log('- The face_registered flag in profiles table might be false');
    console.log('- Or the employee ID in database doesn\'t match ML service files');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCurrentUserFaceCheck().catch(console.error);