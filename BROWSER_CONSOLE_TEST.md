# Browser Console Test for Face Verification

## 🧪 DIRECT BROWSER TEST

**Open browser console (F12) and run this code:**

```javascript
// Test 1: Get current user profile
console.log('Testing current user profile...');
fetch('/api/employees')
  .then(r => r.json())
  .then(data => {
    console.log('Current user profile:', data);
    
    if (data.profile && data.profile.id) {
      const userId = data.profile.id;
      console.log('User ID:', userId);
      
      // Test 2: Check face registration for this user
      console.log('Testing face registration...');
      return fetch('/api/face-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-registration',
          employee_id: userId
        })
      });
    } else {
      throw new Error('No user profile found');
    }
  })
  .then(r => r.json())
  .then(data => {
    console.log('Face registration result:', data);
    
    if (data.registered && data.mlServiceAvailable) {
      console.log('✅ Face verification should work!');
    } else {
      console.log('❌ Face verification will be skipped');
      console.log('- Face registered:', data.registered);
      console.log('- ML Service available:', data.mlServiceAvailable);
    }
  })
  .catch(error => {
    console.log('❌ Test failed:', error);
  });
```

## 🔍 WHAT TO LOOK FOR:

1. **User Profile**: Should show abc@gamil.com user details
2. **Face Registration**: Should show `registered: true`
3. **ML Service**: Should show `mlServiceAvailable: true`

## 🔧 IF TEST FAILS:

### If user profile is null:
- User is not logged in properly
- Try logging out and logging back in

### If face registration is false:
- Database update didn't work
- Run the SQL fix again

### If ML service is false:
- ML service is not running
- Start it with: `cd ml-service && python app_opencv.py`

## 📊 EXPECTED RESULTS:
```javascript
// Expected output:
{
  registered: true,
  mlServiceAvailable: true,
  message: "Face registered and ML service available"
}
```

**Run this test in browser console while logged in as abc@gamil.com**