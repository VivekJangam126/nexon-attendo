// Debug script to test the attendance API directly
// Run this in the browser console while logged in as Siddhesh

console.log('Testing attendance API...');

// Test the attendance service directly
async function testAttendanceAPI() {
    try {
        // Get current user profile
        const profileResponse = await fetch('/api/auth/profile', {
            credentials: 'include'
        });
        const profileData = await profileResponse.json();
        console.log('Current user profile:', profileData);
        
        if (!profileData.success) {
            console.error('Not authenticated or profile fetch failed');
            return;
        }
        
        // Test attendance history API
        const historyResponse = await fetch('/api/attendance/history?limit=30', {
            credentials: 'include'
        });
        const historyData = await historyResponse.json();
        console.log('Attendance history response:', historyData);
        
        if (historyData.success && historyData.data) {
            console.log('Number of records returned:', historyData.data.attendance?.length || 0);
            console.log('First 5 records:', historyData.data.attendance?.slice(0, 5));
        }
        
    } catch (error) {
        console.error('API test error:', error);
    }
}

testAttendanceAPI();