/**
 * Debug Face Registration Issue
 * Check if face registration is working properly
 */

const debugFaceRegistration = async () => {
  console.log('🔍 Debugging Face Registration...');
  
  try {
    // Test 1: Check ML Service
    console.log('\n1. Testing ML Service...');
    const healthResponse = await fetch('http://localhost:5000/health');
    const healthData = await healthResponse.json();
    console.log('✅ ML Service Status:', healthData.status);
    
    // Test 2: Test Face Registration
    console.log('\n2. Testing Face Registration...');
    const mockImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    
    const registerResponse = await fetch('http://localhost:5000/register-face', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: 'test-employee-123',
        image: mockImage,
      }),
    });
    
    const registerData = await registerResponse.json();
    console.log('✅ Face Registration Result:');
    console.log('   Success:', registerData.success);
    console.log('   Encoding Saved:', registerData.encoding_saved);
    console.log('   Message:', registerData.message);
    
    // Test 3: Test Registration Check
    console.log('\n3. Testing Registration Check...');
    const checkResponse = await fetch('http://localhost:5000/check-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: 'test-employee-123',
      }),
    });
    
    const checkData = await checkResponse.json();
    console.log('✅ Registration Check Result:');
    console.log('   Registered:', checkData.registered);
    console.log('   Message:', checkData.message);
    
    // Test 4: Test Frontend API
    console.log('\n4. Testing Frontend API...');
    const frontendResponse = await fetch('http://localhost:8082/api/face-recognition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'check-registration',
        employee_id: 'test-employee-123',
      }),
    });
    
    if (frontendResponse.ok) {
      const frontendData = await frontendResponse.json();
      console.log('✅ Frontend API Result:');
      console.log('   Registered:', frontendData.registered);
      console.log('   Message:', frontendData.message);
    } else {
      console.log('❌ Frontend API Error:', frontendResponse.status, frontendResponse.statusText);
    }
    
    console.log('\n📋 Debug Summary:');
    console.log('   ML Service:', healthData.status);
    console.log('   Registration Works:', registerData.success);
    console.log('   Encoding Saved:', registerData.encoding_saved);
    console.log('   Check Works:', checkData.registered);
    
    if (registerData.encoding_saved && checkData.registered) {
      console.log('\n✅ Face registration is working correctly!');
      console.log('   The issue might be:');
      console.log('   1. Employee photo not uploaded through the system');
      console.log('   2. Database face_registered flag not set');
      console.log('   3. Frontend not calling the check correctly');
    } else {
      console.log('\n❌ Face registration has issues:');
      if (!registerData.encoding_saved) {
        console.log('   - ML service not saving encodings');
      }
      if (!checkData.registered) {
        console.log('   - Registration check failing');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
};

// Run the debug
debugFaceRegistration();