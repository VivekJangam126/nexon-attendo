/**
 * Simple Face Check Debug
 * Check what's actually happening with face registration
 */

console.log('🔍 Simple Face Registration Debug...');

async function debugFaceRegistration() {
  try {
    console.log('\n📋 Step 1: Check ML Service Status...');
    const healthResponse = await fetch('http://localhost:5000/health');
    const healthData = await healthResponse.json();
    console.log('🤖 ML Service Status:', healthData);
    
    console.log('\n📋 Step 2: Check What Faces Are Registered...');
    const debugResponse = await fetch('http://localhost:5000/debug');
    const debugData = await debugResponse.json();
    
    console.log('📁 Storage Path:', debugData.storage_path);
    console.log('📊 Total Files:', debugData.storage_files.length);
    
    const faceIds = debugData.storage_files
      .filter(f => f.endsWith('_features.pkl'))
      .map(f => f.replace('_features.pkl', ''));
    
    console.log('🗂️ Face IDs in ML Service:');
    faceIds.forEach(id => console.log(`  - ${id}`));
    
    console.log('\n📋 Step 3: Test Face Registration Check API...');
    
    // Test the first face ID
    if (faceIds.length > 0) {
      const testId = faceIds[0];
      console.log(`🔍 Testing ID: ${testId}`);
      
      const checkResponse = await fetch('http://localhost:8081/api/face-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-registration',
          employee_id: testId,
        }),
      });
      
      const checkResult = await checkResponse.json();
      console.log('📊 API Check Result:', checkResult);
      
      // If not registered in database, let's manually update it
      if (!checkResult.registered) {
        console.log('\n🔧 Attempting to fix database flag...');
        
        const fixResponse = await fetch('http://localhost:8081/api/face-recognition/sync-flags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_ids: [testId]
          }),
        });
        
        const fixResult = await fixResponse.json();
        console.log('🔧 Fix Result:', fixResult);
        
        // Test again
        const recheckResponse = await fetch('http://localhost:8081/api/face-recognition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check-registration',
            employee_id: testId,
          }),
        });
        
        const recheckResult = await recheckResponse.json();
        console.log('🔍 Recheck Result:', recheckResult);
      }
    }
    
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugFaceRegistration().catch(console.error);