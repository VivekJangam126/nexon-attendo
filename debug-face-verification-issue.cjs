/**
 * Debug Face Verification Issue
 * Check what employee ID is being used vs what's registered
 */

console.log('🔍 Debugging Face Verification Issue...');

// Check what face registrations exist in ML service
async function checkMLServiceRegistrations() {
  try {
    console.log('\n📋 Step 1: Checking ML Service Registrations...');
    
    const response = await fetch('http://localhost:5000/debug');
    const data = await response.json();
    
    console.log('📁 Storage Path:', data.storage_path);
    console.log('📊 Storage Files:', data.storage_files.length);
    console.log('🗂️  Registered Employee IDs:');
    
    const employeeIds = data.storage_files
      .filter(f => f.endsWith('_features.pkl'))
      .map(f => f.replace('_features.pkl', ''));
    
    employeeIds.forEach(id => {
      console.log(`  - ${id}`);
    });
    
    return employeeIds;
  } catch (error) {
    console.error('❌ Failed to check ML service:', error.message);
    return [];
  }
}

// Test face verification for a specific employee
async function testFaceVerification(employeeId) {
  try {
    console.log(`\n🔍 Step 2: Testing Face Verification for ${employeeId}...`);
    
    // Check registration status first
    const checkResponse = await fetch('http://localhost:8081/api/face-recognition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'check-registration',
        employee_id: employeeId,
      }),
    });
    
    const checkData = await checkResponse.json();
    console.log('📊 Registration Status:', checkData);
    
    if (checkData.registered) {
      // Try verification with a test image
      const testImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';
      
      const verifyResponse = await fetch('http://localhost:8081/api/face-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          employee_id: employeeId,
          selfie: testImage,
        }),
      });
      
      const verifyData = await verifyResponse.json();
      console.log('🔍 Verification Result:', verifyData);
    }
    
  } catch (error) {
    console.error('❌ Verification test failed:', error.message);
  }
}

// Run the debug
async function runDebug() {
  const registeredIds = await checkMLServiceRegistrations();
  
  // Test the most recent registration
  if (registeredIds.length > 0) {
    const recentId = '10bc0a21-ddf5-464d-a8c0-24163dfc9eea'; // The one we saw in logs
    await testFaceVerification(recentId);
  }
  
  console.log('\n✅ Debug completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Check if the employee ID in the app matches the registered ID');
  console.log('2. Verify the face registration was successful');
  console.log('3. Test with the actual user\'s selfie instead of test image');
}

runDebug().catch(console.error);