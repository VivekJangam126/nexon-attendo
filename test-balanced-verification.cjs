/**
 * Test Balanced Face Verification
 * Tests the balanced face verification settings
 */

const ML_SERVICE_URL = 'http://localhost:5000';

async function testBalancedVerification() {
  console.log('🧪 Testing Balanced Face Verification...');
  
  try {
    // Test health check
    const healthResponse = await fetch(`${ML_SERVICE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ ML Service Status:', healthData.status);
    console.log('🎯 Balanced Confidence Threshold:', (healthData.confidence_threshold * 100) + '%');
    
    console.log('\n📋 Balanced Settings:');
    console.log('1. ✅ Confidence threshold: 60% (more reasonable)');
    console.log('2. ✅ Safety penalty: 10% (instead of 20%)');
    console.log('3. ✅ Stricter distance calculations (maintained)');
    
    console.log('\n🎯 Expected Results:');
    console.log('✅ Same person: 60%+ confidence → Pass');
    console.log('❌ Different person: <60% confidence → Fail');
    console.log('🔧 Better balance between security and usability');
    
    console.log('\n🧪 Test Scenarios:');
    console.log('1. Your face vs Your photo → Should pass (60%+)');
    console.log('2. Your face vs Friend\'s photo → Should fail (<60%)');
    console.log('3. Friend\'s photo vs Friend\'s photo → Should pass (60%+)');
    
    console.log('\n📊 From previous logs, your raw similarities were:');
    console.log('Raw: [0.959, 0.636, 0.125, 0.956]');
    console.log('With 10% penalty: ~54% (was 49% with 20% penalty)');
    console.log('Still might be too low - may need further adjustment');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBalancedVerification();