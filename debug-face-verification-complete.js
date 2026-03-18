/**
 * Complete Face Verification Debug Script
 * Tests the entire face verification flow step by step
 */

const SIDDHESH_ID = '86a6b1de-390c-4cf3-8968-465e4260ddce';
const SERVER_URL = 'http://localhost:8082';
const ML_SERVICE_URL = 'http://localhost:5000';

const debugFaceVerification = async () => {
  console.log('🔍 Complete Face Verification Debug\n');

  // Step 1: Check ML Service
  console.log('1️⃣ Checking ML Service...');
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`);
    const data = await response.json();
    console.log('✅ ML Service Status:', data);
  } catch (error) {
    console.log('❌ ML Service Error:', error.message);
    console.log('💡 Start ML service: cd ml-service && python app_opencv.py');
    return;
  }

  // Step 2: Check Database Face Registration
  console.log('\n2️⃣ Checking Database Face Registration...');
  try {
    const response = await fetch(`${SERVER_URL}/api/face-recognition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'check-registration',
        employee_id: SIDDHESH_ID
      })
    });
    const data = await response.json();
    console.log('📊 Registration Status:', data);
    
    if (!data.registered) {
      console.log('⚠️  Face not registered in database');
      console.log('💡 Run SQL: fix-siddhesh-face-registration.sql');
      return;
    }
  } catch (error) {
    console.log('❌ Registration Check Error:', error.message);
    return;
  }

  // Step 3: Test Face Verification API
  console.log('\n3️⃣ Testing Face Verification API...');
  
  // Create a test image (small PNG)
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch(`${SERVER_URL}/api/face-recognition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        employee_id: SIDDHESH_ID,
        selfie: testImage
      })
    });
    const data = await response.json();
    console.log('🔍 Verification Result:', data);
  } catch (error) {
    console.log('❌ Verification Error:', error.message);
  }

  // Step 4: Test ML Service Direct Call
  console.log('\n4️⃣ Testing ML Service Direct Call...');
  try {
    const response = await fetch(`${ML_SERVICE_URL}/verify-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: SIDDHESH_ID,
        selfie: testImage
      })
    });
    const data = await response.json();
    console.log('🤖 ML Service Result:', data);
  } catch (error) {
    console.log('❌ ML Service Error:', error.message);
  }

  console.log('\n✅ Debug Complete!');
  console.log('\n📋 Summary:');
  console.log('- ML Service should be running on port 5000');
  console.log('- Face should be registered in database (face_registered = true)');
  console.log('- Face verification should work through both API and ML service');
  console.log('- If face not registered, run: fix-siddhesh-face-registration.sql');
};

// Run debug
debugFaceVerification().catch(console.error);