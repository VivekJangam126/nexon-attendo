/**
 * Debug ML Service Face Verification
 * Test the ML service directly to see why same person gets 0.0% confidence
 */

const debugMLVerification = async () => {
  console.log('🔍 Debugging ML Service Face Verification...\n');

  // Get the abc user ID (from previous database query)
  const ABC_USER_ID = 'a05cf7a'; // Replace with full ID from database

  // Test 1: Check if face is registered in ML service
  console.log('1️⃣ Checking face registration in ML service...');
  try {
    const response = await fetch('http://localhost:5000/check-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: ABC_USER_ID
      })
    });
    
    const data = await response.json();
    console.log('📊 ML Service Registration Check:', data);
  } catch (error) {
    console.log('❌ ML Service Registration Check Failed:', error.message);
  }

  // Test 2: Test verification with a simple test image
  console.log('\n2️⃣ Testing face verification with test image...');
  
  // Create a simple test image (1x1 pixel)
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch('http://localhost:5000/verify-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: ABC_USER_ID,
        selfie: testImage
      })
    });
    
    const data = await response.json();
    console.log('📊 ML Service Verification Result:', data);
  } catch (error) {
    console.log('❌ ML Service Verification Failed:', error.message);
  }

  // Test 3: Check ML service health and configuration
  console.log('\n3️⃣ Checking ML service configuration...');
  try {
    const response = await fetch('http://localhost:5000/health');
    const data = await response.json();
    console.log('🤖 ML Service Health:', data);
  } catch (error) {
    console.log('❌ ML Service Health Check Failed:', error.message);
  }

  console.log('\n📋 Debug Summary:');
  console.log('- Check if face is registered in ML service database');
  console.log('- Check verification process and confidence calculation');
  console.log('- Check for any errors in face detection or feature extraction');
};

// Run debug
debugMLVerification().catch(console.error);