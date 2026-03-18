/**
 * Debug Employees API
 * Check what the employees API actually returns
 */

console.log('🔍 Debugging Employees API...');

async function debugEmployeesAPI() {
  try {
    console.log('\n📋 Testing Employees API...');
    
    const response = await fetch('http://localhost:8081/api/employees');
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response OK:', response.ok);
    
    const text = await response.text();
    console.log('📊 Raw Response:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('📊 Parsed JSON:', json);
      console.log('📊 JSON Type:', typeof json);
      console.log('📊 JSON Keys:', Object.keys(json));
      
      if (json.data) {
        console.log('📊 Data Type:', typeof json.data);
        console.log('📊 Data Length:', json.data?.length);
        if (Array.isArray(json.data) && json.data.length > 0) {
          console.log('📊 First Employee:', json.data[0]);
        }
      }
    } catch (parseError) {
      console.log('❌ JSON Parse Error:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugEmployeesAPI().catch(console.error);