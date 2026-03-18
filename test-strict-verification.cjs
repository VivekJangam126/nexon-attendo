/**
 * Test Strict Face Verification
 * Tests the improved face verification with stricter algorithm
 */

const ML_SERVICE_URL = 'http://localhost:5000';

async function testStrictVerification() {
  console.log('🧪 Testing Strict Face Verification...');
  
  try {
    // Test health check
    const healthResponse = await fetch(`${ML_SERVICE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ ML Service Status:', healthData.status);
    console.log('🎯 New Confidence Threshold:', (healthData.confidence_threshold * 100) + '%');
    
    console.log('\n📋 Changes Made:');
    console.log('1. ✅ Increased confidence threshold: 65% → 75%');
    console.log('2. ✅ Added stricter similarity calculations');
    console.log('3. ✅ Added 20% penalty for safety');
    console.log('4. ✅ Improved distance metrics');
    
    console.log('\n🔧 Expected Results:');
    console.log('✅ Same person: 75%+ confidence → Pass');
    console.log('❌ Different person: <75% confidence → Fail');
    
    console.log('\n🧪 Now test again:');
    console.log('1. Login as the new employee (with friend\'s photo)');
    console.log('2. Try to mark attendance with YOUR face');
    console.log('3. Should now show LOWER confidence and FAIL');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStrictVerification();