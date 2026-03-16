/**
 * Debug Face Registration Check
 * Test what the frontend is actually receiving
 */

const debugFaceCheck = async () => {
  console.log('🔍 Debugging Face Registration Check from Frontend...');
  
  try {
    // Test with dattu's employee ID
    const employeeId = '3917c798-a505-4109-9fac-9d5faef57c4a'; // dattu
    
    console.log('\n1. Testing Direct ML Service...');
    const mlResponse = await fetch('http://localhost:5000/check-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: employeeId,
      }),
    });
    
    const mlData = await mlResponse.json();
    console.log('ML Service Response:');
    console.log('   Registered:', mlData.registered);
    console.log('   Message:', mlData.message);
    
    console.log('\n2. Testing Frontend API (what dashboard calls)...');
    const frontendResponse = await fetch('http://localhost:8082/api/face-recognition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'check-registration',
        employee_id: employeeId,
      }),
    });
    
    const frontendData = await frontendResponse.json();
    console.log('Frontend API Response:');
    console.log('   Registered:', frontendData.registered);
    console.log('   Message:', frontendData.message);
    
    console.log('\n3. Testing Attendance Service Method...');
    // This simulates what the dashboard actually calls
    const attendanceResponse = await fetch('http://localhost:8082/api/face-recognition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'check-registration',
        employee_id: employeeId,
      }),
    });
    
    const attendanceData = await attendanceResponse.json();
    console.log('Attendance Service Response:');
    console.log('   Registered:', attendanceData.registered);
    console.log('   ML Service Available:', attendanceData.mlServiceAvailable || 'NOT INCLUDED');
    console.log('   Message:', attendanceData.message);
    
    console.log('\n🔍 ANALYSIS:');
    console.log('Dashboard condition: faceStatus.registered && faceStatus.mlServiceAvailable');
    console.log('   faceStatus.registered:', attendanceData.registered);
    console.log('   faceStatus.mlServiceAvailable:', attendanceData.mlServiceAvailable || 'MISSING!');
    
    if (attendanceData.registered && attendanceData.mlServiceAvailable) {
      console.log('✅ Should show face verification modal');
    } else if (attendanceData.registered && !attendanceData.mlServiceAvailable) {
      console.log('❌ Face registered but ML service not available - this is the issue!');
    } else if (!attendanceData.registered) {
      console.log('❌ Face not registered');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
};

// Run the debug
debugFaceCheck();