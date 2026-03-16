/**
 * Debug the exact query the frontend is making vs what we have in database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugFrontendQuery() {
  try {
    console.log('🔍 Debugging frontend query vs database reality...');
    
    const siddheshId = '86a6b1de-390c-4cf3-8968-465e4260ddce';
    
    // Check what the frontend is actually seeing
    console.log('1. Testing exact frontend query with all parameters...');
    
    const { data: frontendQuery, error: frontendError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', siddheshId)
      .order('date', { ascending: false })
      .limit(30);

    if (frontendError) {
      console.log('❌ Frontend query error:', frontendError.message);
      return;
    }

    console.log(`📊 Frontend query returns: ${frontendQuery?.length || 0} records`);
    
    if (frontendQuery && frontendQuery.length > 0) {
      console.log('\n📅 All records from frontend query:');
      frontendQuery.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.date}: ${record.status} - ${record.check_in_time}`);
      });

      // Calculate what the frontend SHOULD show for last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      console.log(`\n🔍 Filtering for last 7 days (${sevenDaysAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}):`);
      
      const last7Days = frontendQuery.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= sevenDaysAgo && recordDate <= today;
      });

      console.log(`📊 Last 7 days records: ${last7Days.length}`);
      last7Days.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.date}: ${record.status}`);
      });

      const presentCount = last7Days.filter(r => r.status === 'present').length;
      const lateCount = last7Days.filter(r => r.status === 'late').length;
      const absentCount = last7Days.filter(r => r.status === 'absent').length;

      console.log(`\n📊 Expected frontend summary:`);
      console.log(`   Present: ${presentCount} (frontend shows: 1)`);
      console.log(`   Late: ${lateCount} (frontend shows: 0)`);
      console.log(`   Absent: ${absentCount} (frontend shows: 0)`);

      if (presentCount !== 1 || lateCount !== 0) {
        console.log('\n❌ MISMATCH DETECTED!');
        console.log('🔍 The database has different data than what frontend shows');
        
        // Check if there's a today record that might be interfering
        const todayStr = today.toISOString().split('T')[0];
        const todayRecord = frontendQuery.find(r => r.date === todayStr);
        
        console.log(`\n📅 Today's record (${todayStr}):`);
        if (todayRecord) {
          console.log(`   Status: ${todayRecord.status}`);
          console.log(`   Check-in: ${todayRecord.check_in_time}`);
          console.log(`   ID: ${todayRecord.id}`);
        } else {
          console.log('   No record for today');
        }

        // Check if there are multiple records for today
        const todayRecords = frontendQuery.filter(r => r.date === todayStr);
        if (todayRecords.length > 1) {
          console.log(`\n⚠️ Multiple records for today: ${todayRecords.length}`);
          todayRecords.forEach((record, index) => {
            console.log(`   ${index + 1}. ${record.status} - ${record.check_in_time} (ID: ${record.id})`);
          });
        }
      } else {
        console.log('\n✅ Data matches what frontend should show');
        console.log('🤔 The issue might be in the frontend logic or caching');
      }

    } else {
      console.log('❌ No records returned from frontend query');
    }

    // Let's also check if there might be a different user being queried
    console.log('\n2. Checking if there might be a different user session...');
    
    // Check if there are any other users with similar names
    const { data: similarUsers } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('full_name', '%siddhesh%');

    if (similarUsers && similarUsers.length > 0) {
      console.log(`📋 Users with similar names: ${similarUsers.length}`);
      for (const user of similarUsers) {
        console.log(`   - ${user.full_name} (${user.email}) - ID: ${user.id}`);
        
        if (user.id !== siddheshId) {
          const { data: otherAttendance } = await supabase
            .from('attendance')
            .select('date, status')
            .eq('user_id', user.id)
            .limit(5);
          
          console.log(`     Attendance records: ${otherAttendance?.length || 0}`);
        }
      }
    }

    // Check if the frontend might be using a different API endpoint
    console.log('\n3. Checking server-side attendance service...');
    console.log('💡 The issue might be:');
    console.log('   1. Frontend is calling a different API endpoint');
    console.log('   2. Server-side service has different logic');
    console.log('   3. There\'s middleware filtering the data');
    console.log('   4. The fillMissingDates function is overriding real data');

    // Let's check what happens if we simulate the fillMissingDates logic
    console.log('\n4. Simulating fillMissingDates logic...');
    
    const recordMap = new Map();
    frontendQuery.forEach(record => {
      const normalizedDate = record.date.split('T')[0];
      recordMap.set(normalizedDate, record);
    });

    console.log(`📊 Record map has ${recordMap.size} unique dates`);
    
    // Check last 7 days in the map
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (recordMap.has(dateStr)) {
        const record = recordMap.get(dateStr);
        console.log(`   ${dateStr}: ${record.status} (from DB)`);
      } else {
        console.log(`   ${dateStr}: would be marked as absent (missing)`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugFrontendQuery();