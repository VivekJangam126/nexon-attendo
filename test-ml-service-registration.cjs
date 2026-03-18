/**
 * Test ML Service Registration
 * Tests if the new burst mode ML service is working correctly
 */

const fetch = require('node-fetch');

async function testMLServiceRegistration() {
    console.log('🧪 Testing ML Service Registration...');
    
    try {
        // Test 1: Check if ML service is running
        console.log('\n1. Testing ML service health...');
        const healthResponse = await fetch('http://localhost:5000/health');
        const healthData = await healthResponse.json();
        console.log('✅ ML Service Status:', healthData.service, healthData.version);
        console.log('📊 Confidence Threshold:', healthData.confidence_threshold);
        
        // Test 2: Check current stats
        console.log('\n2. Checking current stats...');
        const statsResponse = await fetch('http://localhost:5000/stats');
        const statsData = await statsResponse.json();
        console.log('📈 Registered Employees:', statsData.registered_employees);
        console.log('📁 Employee Folders:', statsData.employee_folders?.length || 0);
        console.log('📸 Total Photos:', statsData.total_photos_stored || 0);
        
        // Test 3: Create a dummy base64 image for testing
        console.log('\n3. Creating test registration...');
        const testEmployeeId = 'test-employee-' + Date.now();
        
        // Create a simple 1x1 pixel base64 image for testing
        const testImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
        
        // Create array of test images (simulate 50 photos)
        const testPhotos = Array(50).fill(testImage);
        
        const registrationData = {
            employee_id: testEmployeeId,
            face_photos: testPhotos
        };
        
        console.log(`📝 Registering test employee: ${testEmployeeId}`);
        console.log(`📸 With ${testPhotos.length} photos`);
        
        const registerResponse = await fetch('http://localhost:5000/register-face', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData)
        });
        
        const registerResult = await registerResponse.json();
        console.log('📋 Registration Result:', {
            success: registerResult.success,
            message: registerResult.message,
            faces_detected: registerResult.faces_detected,
            encoding_saved: registerResult.encoding_saved
        });
        
        if (registerResult.success) {
            console.log('✅ Test registration successful!');
            
            // Test 4: Check if folder was created
            console.log('\n4. Checking if employee folder was created...');
            const updatedStatsResponse = await fetch('http://localhost:5000/stats');
            const updatedStatsData = await updatedStatsResponse.json();
            console.log('📈 Updated Registered Employees:', updatedStatsData.registered_employees);
            console.log('📁 Updated Employee Folders:', updatedStatsData.employee_folders?.length || 0);
            
            if (updatedStatsData.employee_folders?.length > 0) {
                const testFolder = updatedStatsData.employee_folders.find(f => f.employee_id === testEmployeeId);
                if (testFolder) {
                    console.log('✅ Test employee folder created:', testFolder.employee_id);
                    console.log('📸 Photos in folder:', testFolder.photo_count);
                } else {
                    console.log('❌ Test employee folder not found');
                }
            }
        } else {
            console.log('❌ Test registration failed:', registerResult.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testMLServiceRegistration();