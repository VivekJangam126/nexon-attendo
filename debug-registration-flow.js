// Debug script to test the registration flow
const fetch = require('node-fetch');

async function testRegistrationFlow() {
    console.log('🧪 Testing Registration Flow...');
    
    // Test 1: Check ML service health
    console.log('\n1. Testing ML Service Health...');
    try {
        const healthResponse = await fetch('http://localhost:5000/health');
        const healthData = await healthResponse.json();
        console.log('✅ ML Service Health:', healthData.service);
    } catch (error) {
        console.log('❌ ML Service Health Failed:', error.message);
        return;
    }
    
    // Test 2: Test direct face registration with ML service
    console.log('\n2. Testing Direct Face Registration...');
    const testEmployeeId = 'test-debug-' + Date.now();
    const dummyPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBkQgUobHB0fAjM+HxFQkSU2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';
    
    try {
        const regResponse = await fetch('http://localhost:5000/register-face', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                employee_id: testEmployeeId,
                face_photos: [dummyPhoto] // Single test photo
            })
        });
        
        const regData = await regResponse.json();
        console.log('✅ Direct Registration Result:', {
            success: regData.success,
            message: regData.message,
            faces_detected: regData.faces_detected
        });
        
        if (regData.success) {
            console.log('✅ Test registration successful - ML service is working');
        } else {
            console.log('❌ Test registration failed:', regData.message);
        }
        
    } catch (error) {
        console.log('❌ Direct Registration Failed:', error.message);
    }
    
    // Test 3: Check current storage
    console.log('\n3. Checking Current Storage...');
    try {
        const statsResponse = await fetch('http://localhost:5000/stats');
        const statsData = await statsResponse.json();
        console.log('📊 Current Storage Stats:', {
            registered_employees: statsData.registered_employees,
            total_photos: statsData.total_photos_stored,
            employee_folders: statsData.employee_folders
        });
    } catch (error) {
        console.log('❌ Stats Check Failed:', error.message);
    }
}

testRegistrationFlow().catch(console.error);