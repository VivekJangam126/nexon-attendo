/**
 * Check Face Registration Status
 * Shows which employees have photos but need re-registration with new ML service
 */

const fs = require('fs');
const path = require('path');

async function checkRegistrationStatus() {
  console.log('🔍 Checking Face Registration Status...\n');
  
  try {
    // Check face_storage directory
    const faceStoragePath = path.join(__dirname, 'ml-service', 'face_storage');
    console.log('📁 Face Storage Directory:', faceStoragePath);
    
    if (fs.existsSync(faceStoragePath)) {
      const files = fs.readdirSync(faceStoragePath);
      console.log('📂 Files in face_storage:', files.length);
      
      if (files.length > 0) {
        console.log('📋 Registered faces:');
        files.forEach(file => {
          if (file.includes('_original.jpg')) {
            const employeeId = file.replace('_original.jpg', '');
            console.log(`  ✅ ${employeeId}`);
          }
        });
      } else {
        console.log('❌ No registered faces found in local storage');
      }
    } else {
      console.log('❌ Face storage directory does not exist');
    }
    
    console.log('\n🔧 To fix the "No registered face found" issue:');
    console.log('1. Stop current ML service (Ctrl+C in the terminal running it)');
    console.log('2. Navigate to ml-service directory: cd ml-service');
    console.log('3. Activate virtual environment: venv\\Scripts\\activate');
    console.log('4. Start advanced ML service: python app_opencv_advanced.py');
    console.log('5. Go to Admin Panel → Employee Management');
    console.log('6. Re-upload employee photos (this will register them with new service)');
    console.log('7. Test face verification');
    
    console.log('\n📋 Employee ID from error: 10bc0a21-ddf5-464d-a8c0-24163dfc9eea');
    console.log('👤 This employee needs their photo re-uploaded to register with new ML service');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRegistrationStatus();