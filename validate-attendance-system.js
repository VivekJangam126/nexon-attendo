/**
 * Comprehensive Attendance System Validation
 * Fetches settings and attendance data, then validates the logic
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateSystem() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        ATTENDANCE SYSTEM VALIDATION REPORT                ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  // Step 1: Fetch Attendance Settings
  log('\n📋 STEP 1: Fetching Attendance Settings', 'blue');
  log('─'.repeat(60), 'blue');
  
  const { data: settings, error: settingsError } = await supabase
    .from('attendance_settings')
    .select('*')
    .eq('setting_name', 'default_attendance_window')
    .eq('is_active', true)
    .maybeSingle();
  
  if (settingsError || !settings) {
    log('❌ Failed to fetch settings', 'red');
    console.log(settingsError);
    process.exit(1);
  }
  
  log('✅ Settings fetched successfully', 'green');
  console.log('');
  log(`  Start Time: ${settings.start_time}`, 'cyan');
  log(`  End Time: ${settings.end_time}`, 'cyan');
  log(`  Grace Period: ${settings.grace_period_minutes} minutes`, 'cyan');
  log(`  Strict Mode: ${settings.strict_mode}`, 'cyan');
  log(`  Active: ${settings.is_active}`, 'cyan');
  
  // Parse settings
  const [startHour, startMinute] = settings.start_time.split(':').map(Number);
  const windowStartMinutes = startHour * 60 + startMinute;
  const gracePeriodMinutes = settings.grace_period_minutes;
  const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
  
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  };
  
  console.log('');
  log('📊 Calculated Values:', 'yellow');
  log(`  Window starts at: ${formatTime(windowStartMinutes)} (${windowStartMinutes} minutes)`, 'yellow');
  log(`  Grace period ends at: ${formatTime(gracePeriodEndMinutes)} (${gracePeriodEndMinutes} minutes)`, 'yellow');
  
  // Step 2: Fetch Today's Attendance
  log('\n📋 STEP 2: Fetching Today\'s Attendance Records', 'blue');
  log('─'.repeat(60), 'blue');
  
  const today = new Date().toISOString().split('T')[0];
  
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select(`
      id,
      user_id,
      check_in_time,
      status
    `)
    .eq('date', today)
    .order('check_in_time', { ascending: true });
  
  if (attendanceError) {
    log('❌ Failed to fetch attendance', 'red');
    console.log(attendanceError);
    process.exit(1);
  }
  
  // Fetch user names separately
  const userIds = attendance.map(a => a.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);
  
  const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
  
  log(`✅ Found ${attendance.length} attendance records for ${today}`, 'green');
  
  // Step 3: Validate Each Record
  log('\n📋 STEP 3: Validating Attendance Records', 'blue');
  log('─'.repeat(60), 'blue');
  
  let correctCount = 0;
  let incorrectCount = 0;
  const issues = [];
  
  console.log('');
  log('Employee Name                    | Check-in (IST) | Current | Expected | Status', 'magenta');
  log('─'.repeat(90), 'magenta');
  
  attendance.forEach(record => {
    // Convert UTC to IST
    const checkInDate = new Date(record.check_in_time);
    const istTimeStr = checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istTimeStr);
    
    const checkInHour = istDate.getHours();
    const checkInMinute = istDate.getMinutes();
    const checkInMinutes = checkInHour * 60 + checkInMinute;
    
    // Determine expected status
    const expectedStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
    const isCorrect = record.status === expectedStatus;
    
    // Format for display
    const name = (profileMap.get(record.user_id) || 'Unknown').padEnd(30);
    const timeStr = `${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}`.padEnd(14);
    const current = record.status.toUpperCase().padEnd(7);
    const expected = expectedStatus.toUpperCase().padEnd(8);
    const statusIcon = isCorrect ? '✅' : '❌';
    
    const line = `${name} | ${timeStr} | ${current} | ${expected} | ${statusIcon}`;
    
    if (isCorrect) {
      log(line, 'green');
      correctCount++;
    } else {
      log(line, 'red');
      incorrectCount++;
      issues.push({
        name: profileMap.get(record.user_id) || 'Unknown',
        checkInTime: `${checkInHour}:${checkInMinute.toString().padStart(2, '0')}`,
        checkInMinutes,
        currentStatus: record.status,
        expectedStatus,
        id: record.id,
      });
    }
  });
  
  // Step 4: Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    VALIDATION SUMMARY                      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  console.log('');
  log(`Total Records: ${attendance.length}`, 'blue');
  log(`✅ Correct: ${correctCount}`, 'green');
  log(`❌ Incorrect: ${incorrectCount}`, 'red');
  
  if (incorrectCount > 0) {
    log('\n⚠️  ISSUES FOUND:', 'yellow');
    log('─'.repeat(60), 'yellow');
    
    issues.forEach(issue => {
      console.log('');
      log(`Employee: ${issue.name}`, 'yellow');
      log(`  Check-in: ${issue.checkInTime} IST (${issue.checkInMinutes} minutes)`, 'yellow');
      log(`  Current Status: ${issue.currentStatus.toUpperCase()}`, 'red');
      log(`  Expected Status: ${issue.expectedStatus.toUpperCase()}`, 'green');
      log(`  Grace Period Ends: ${formatTime(gracePeriodEndMinutes)}`, 'yellow');
      log(`  Record ID: ${issue.id}`, 'yellow');
    });
    
    log('\n📝 SQL to Fix Issues:', 'cyan');
    log('─'.repeat(60), 'cyan');
    console.log('');
    console.log('-- Run this in Supabase SQL Editor:');
    console.log('');
    issues.forEach(issue => {
      console.log(`UPDATE attendance SET status = '${issue.expectedStatus}', updated_at = NOW() WHERE id = '${issue.id}';`);
    });
    console.log('');
    
    log('\n❌ VALIDATION FAILED - Some records have incorrect status', 'red');
  } else {
    log('\n✅ VALIDATION PASSED - All records are correct!', 'green');
  }
  
  // Step 5: Logic Verification
  log('\n📋 STEP 4: Logic Verification', 'blue');
  log('─'.repeat(60), 'blue');
  
  const testCases = [
    { time: windowStartMinutes - 10, label: '10 min before start', expected: 'present' },
    { time: windowStartMinutes, label: 'Exactly at start', expected: 'present' },
    { time: windowStartMinutes + 10, label: '10 min after start', expected: 'present' },
    { time: gracePeriodEndMinutes, label: 'At grace period end', expected: 'present' },
    { time: gracePeriodEndMinutes + 1, label: '1 min after grace', expected: 'late' },
    { time: gracePeriodEndMinutes + 30, label: '30 min after grace', expected: 'late' },
  ];
  
  console.log('');
  log('Test Case                        | Time       | Expected | Logic', 'magenta');
  log('─'.repeat(70), 'magenta');
  
  testCases.forEach(test => {
    const result = test.time <= gracePeriodEndMinutes ? 'present' : 'late';
    const isCorrect = result === test.expected;
    const label = test.label.padEnd(30);
    const time = formatTime(test.time).padEnd(10);
    const expected = test.expected.toUpperCase().padEnd(8);
    const status = isCorrect ? '✅' : '❌';
    
    log(`${label} | ${time} | ${expected} | ${status}`, isCorrect ? 'green' : 'red');
  });
  
  log('\n' + '═'.repeat(60), 'cyan');
  
  if (incorrectCount === 0) {
    log('\n🎉 ALL SYSTEMS OPERATIONAL!', 'green');
    log('The attendance marking logic is working correctly.', 'green');
  } else {
    log('\n⚠️  ACTION REQUIRED:', 'yellow');
    log(`Fix ${incorrectCount} incorrect record(s) using the SQL above.`, 'yellow');
  }
  
  console.log('');
}

validateSystem().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
