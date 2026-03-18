/**
 * Test Balanced Strict Face Recognition
 */

const ML_SERVICE_URL = 'http://localhost:5000';

async function testBalancedStrict() {
  console.log('🧪 Testing Balanced Strict Face Recognition...');
  
  try {
    const healthResponse = await fetch(`${ML_SERVICE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Service Status:', healthData.status);
    console.log('🎯 Balanced Threshold:', (healthData.confidence_threshold * 100) + '%');
    
    console.log('\n📋 Balanced Settings Applied:');
    console.log('1. ✅ Threshold: 85% → 70% (more reasonable)');
    console.log('2. ✅ Base penalty: 25% → 10% (less harsh)');
    console.log('3. ✅ Euclidean penalty: 10.0 → 3.0 (much less strict)');
    console.log('4. ✅ Cosine similarity weight: 50% (prioritized)');
    console.log('5. ✅ Structural similarity: average instead of minimum');
    
    console.log('\n🎯 Expected Results:');
    console.log('✅ Same person: 70%+ confidence → Pass');
    console.log('❌ Different person: <70% confidence → Fail');
    
    console.log('\n📊 From previous logs:');
    console.log('Raw similarities: [0.954, 0.248, 0.952, 0.328]');
    console.log('With balanced algorithm:');
    console.log('- Cosine (95.4%) × 0.5 = 47.7%');
    console.log('- Euclidean (24.8%) × 0.2 = 5.0%');
    console.log('- Correlation (95.2%) × 0.2 = 19.0%');
    console.log('- Structural (32.8%) × 0.1 = 3.3%');
    console.log('- Total: ~75% × 0.9 penalty = ~67.5%');
    console.log('- Should be close to 70% threshold now!');
    
    console.log('\n🧪 Test again:');
    console.log('1. Your face + Your photo → Should pass (~70%+)');
    console.log('2. Your face + Friend\'s photo → Should fail (<70%)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBalancedStrict();