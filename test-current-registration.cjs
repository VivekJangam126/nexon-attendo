/**
 * Test Current Face Registration
 * Tests the currently registered face for the employee
 */

const fs = require('fs');
const path = require('path');

const employeeId = '10bc0a21-ddf5-464d-a8c0-24163dfc9eea';
const ML_SERVICE_URL = 'http://localhost:5000';

async function testCurrentRegistration() {
  console.log('🧪 Testing Current Face Registration...');
  console.log('👤 Employee ID:', employeeId);
  
  try {
    // Check if files exist
    const storagePath = path.join(__dirname, 'ml-service', 'face_storage');
    const originalPath = path.join(storagePath, `${employeeId}_original.jpg`);
    const featuresPath = path.join(storagePath, `${employeeId}_features.pkl`);
    
    console.log('\n📁 Checking local files:');
    console.log('📷 Original image:', fs.existsSync(originalPath) ? '✅ EXISTS' : '❌ MISSING');
    console.log('🔢 Features file:', fs.existsSync(featuresPath) ? '✅ EXISTS' : '❌ MISSING');
    
    if (fs.existsSync(originalPath)) {
      const stats = fs.statSync(originalPath);
      console.log('📊 Image size:', Math.round(stats.size / 1024), 'KB');
      console.log('📅 Last modified:', stats.mtime.toLocaleString());
    }
    
    // Test with a simple 1x1 pixel image (should fail)
    console.log('\n🧪 Testing verification with test image...');
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA0VaS9QAAAABJRU5ErkJggg==';
    
    const verifyResponse = await fetch(`${ML_SERVICE_URL}/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: employeeId,
        selfie: testImageBase64
      })
    });
    
    const verifyData = await verifyResponse.json();
    console.log('🔍 Verification result:', verifyData);
    
    if (!verifyData.success) {
      console.log('\n❌ Verification failed. This could mean:');
      console.log('1. The registered face features are corrupted');
      console.log('2. The test image is too small/simple');
      console.log('3. There\'s an issue with the ML service');
      
      console.log('\n🔧 Solution: Re-upload the employee photo');
      console.log('1. Go to Admin Panel → Employee Management');
      console.log('2. Find the employee and click on them');
      console.log('3. Upload a clear, front-facing photo');
      console.log('4. Make sure it\'s YOUR photo, not your friend\'s');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCurrentRegistration();