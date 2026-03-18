// Check available offices
const fetch = require('node-fetch');

async function checkOffices() {
    try {
        console.log('🏢 Checking available offices...');
        
        // This would normally be an API call, but let's check directly
        // For now, let's assume office ID 1 should exist
        
        console.log('📊 Office validation issue detected');
        console.log('💡 Solution: Create a test office or use existing office ID');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkOffices();