/**
 * Grace Period & Attendance Settings Test Script
 * Tests all functionality related to grace period, window settings, and employee data
 * 
 * Run with: npm run test:grace-period
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`TEST: ${testName}`, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Test 1: Fetch Current Attendance Window Settings
async function testFetchWindowSettings() {
  logTest('Fetch Current Attendance Window Settings');
  
  try {
    const { data: window, error } = await supabase
      .from('attendance_settings')
      .select('*')
      .eq('setting_name', 'default_attendance_window')
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) {
      logError(`Failed to fetch window settings: ${error.message}`);
      return false;
    }
    
    if (!window) {
      logError('No active window found');
      return false;
    }
    
    logSuccess('Window settings fetched successfully');
    logInfo(`Start Time: ${window.start_time}`);
    logInfo(`End Time: ${window.end_time}`);
    logInfo(`Grace Period: ${window.grace_period_minutes} minutes`);
    logInfo(`Strict Mode: ${window.strict_mode}`);
    logInfo(`Active: ${window.is_active}`);
    
    return true;
  } catch (err) {
    logError(`Exception: ${err.message}`);
    return false;
  }
}

// Test 2: Test Grace Period Calculation
async function testGracePeriodCalculation() {
  logTest('Grace Period Calculation Logic');
  
  try {
    const { data: window } = await supabase
      .from('attendance_settings')
      .select('*')
      .eq('setting_name', 'default_attendance_window')
      .eq('is_active', true)
      .maybeSingle();
    
    if (!window) {
      logError('No window settings found');
      return false;
    }
    
    // Parse window start time
    const [startHour, startMinute] = window.start_time.split(':').map(Number);
    const windowStartMinutes = startHour * 60 + startMinute;
    
    // Get grace period
    const gracePeriodMinutes = window.grace_period_minutes || 15;
    const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
    
    logSuccess('Grace period calculation successful');
    logInfo(`Window starts at: ${startHour}:${startMinute.toString().padStart(2, '0')} (${windowStartMinutes} minutes)`);
    logInfo(`Grace period: ${gracePeriodMinutes} minutes`);
    logInfo(`Grace period ends at: ${Math.floor(gracePeriodEndMinutes / 60)}:${(gracePeriodEndMinutes % 60).toString().padStart(2, '0')} (${gracePeriodEndMinutes} minutes)`);
    
    // Test scenarios
    const testTimes = [
      { hour: startHour, minute: startMinute, expected: 'present', label: 'Exactly at start time' },
      { hour: startHour, minute: startMinute + 10, expected: 'present', label: '10 min after start' },
      { hour: Math.floor(gracePeriodEndMinutes / 60), minute: gracePeriodEndMinutes % 60, expected: 'present', label: 'Exactly at grace period end' },
      { hour: Math.floor(gracePeriodEndMinutes / 60), minute: (gracePeriodEndMinutes % 60) + 1, expected: 'late', label: '1 min after grace period' },
      { hour: 12, minute: 0, expected: 'late', label: 'Noon (12:00 PM)' },
      { hour: 15, minute: 30, expected: 'late', label: 'Afternoon (3:30 PM)' },
    ];
    
    console.log('\n' + '-'.repeat(60));
    log('Testing different check-in times:', 'yellow');
    console.log('-'.repeat(60));
    
    testTimes.forEach(test => {
      const checkInMinutes = test.hour * 60 + test.minute;
      const actualStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
      const passed = actualStatus === test.expected;
      
      const timeStr = `${test.hour.toString().padStart(2, '0')}:${test.minute.toString().padStart(2, '0')}`;
      const statusStr = `${actualStatus.toUpperCase()}`;
      
      if (passed) {
        logSuccess(`${timeStr} (${test.label}) → ${statusStr}`);
      } else {
        logError(`${timeStr} (${test.label}) → ${statusStr} (expected ${test.expected.toUpperCase()})`);
      }
    });
    
    return true;
  } catch (err) {
    logError(`Exception: ${err.message}`);
    return false;
  }
}

// Test 3: Fetch Employee Data with Attendance
async function testFetchEmployeeData() {
  logTest('Fetch Employee Data with Today\'s Attendance');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch all employees
    const { data: employees, error: empError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .order('full_name', { ascending: true });
    
    if (empError) {
      logError(`Failed to fetch employees: ${empError.message}`);
      return false;
    }
    
    // Fetch today's attendance
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('user_id, check_in_time, status')
      .eq('date', today);
    
    if (attError) {
      logError(`Failed to fetch attendance: ${attError.message}`);
      return false;
    }
    
    // Create attendance map
    const attendanceMap = new Map();
    attendance.forEach(att => {
      attendanceMap.set(att.user_id, att);
    });
    
    logSuccess(`Fetched ${employees.length} employees`);
    
    // Count by status
    const statusCounts = {
      present: 0,
      late: 0,
      absent: 0,
      not_marked: 0,
    };
    
    employees.forEach(emp => {
      const att = attendanceMap.get(emp.id);
      const status = att ? att.status : 'not_marked';
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    });
    
    console.log('\n' + '-'.repeat(60));
    log('Attendance Status Summary:', 'yellow');
    console.log('-'.repeat(60));
    logInfo(`Present: ${statusCounts.present}`);
    logInfo(`Late: ${statusCounts.late}`);
    logInfo(`Absent: ${statusCounts.absent}`);
    logInfo(`Not Marked: ${statusCounts.not_marked}`);
    
    // Show sample employees with check-in times
    console.log('\n' + '-'.repeat(60));
    log('Sample Employee Data (first 5 with attendance):', 'yellow');
    console.log('-'.repeat(60));
    
    const employeesWithAttendance = employees
      .map(emp => ({
        ...emp,
        attendance: attendanceMap.get(emp.id)
      }))
      .filter(emp => emp.attendance);
    
    employeesWithAttendance.slice(0, 5).forEach(emp => {
      const checkInTime = emp.attendance.check_in_time
        ? new Date(emp.attendance.check_in_time).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
          })
        : 'N/A';
      
      logInfo(`${emp.full_name}: ${checkInTime} → ${emp.attendance.status.toUpperCase()}`);
    });
    
    return true;
  } catch (err) {
    logError(`Exception: ${err.message}`);
    return false;
  }
}

// Test 4: Verify Attendance Records in Database
async function testAttendanceRecords() {
  logTest('Verify Attendance Records in Database');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: records, error } = await supabase
      .from('attendance')
      .select('id, user_id, check_in_time, status')
      .eq('date', today)
      .order('check_in_time', { ascending: true });
    
    if (error) {
      logError(`Failed to fetch attendance records: ${error.message}`);
      return false;
    }
    
    logSuccess(`Found ${records.length} attendance records for today`);
    
    // Get window settings for validation
    const { data: window } = await supabase
      .from('attendance_settings')
      .select('*')
      .eq('setting_name', 'default_attendance_window')
      .eq('is_active', true)
      .maybeSingle();
      
    if (!window) {
      logError('No window settings found');
      return false;
    }
    
    const [startHour, startMinute] = window.start_time.split(':').map(Number);
    const windowStartMinutes = startHour * 60 + startMinute;
    const gracePeriodMinutes = window.grace_period_minutes || 15;
    const gracePeriodEndMinutes = windowStartMinutes + gracePeriodMinutes;
    
    console.log('\n' + '-'.repeat(60));
    log('Validating Attendance Records:', 'yellow');
    console.log('-'.repeat(60));
    
    let correctCount = 0;
    let incorrectCount = 0;
    
    records.forEach(record => {
      // Convert UTC to IST
      const checkInDate = new Date(record.check_in_time);
      const istTime = new Date(checkInDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const checkInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
      
      const expectedStatus = checkInMinutes <= gracePeriodEndMinutes ? 'present' : 'late';
      const isCorrect = record.status === expectedStatus;
      
      const timeStr = istTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      
      if (isCorrect) {
        correctCount++;
        logSuccess(`${timeStr} → ${record.status.toUpperCase()} ✓`);
      } else {
        incorrectCount++;
        logError(`${timeStr} → ${record.status.toUpperCase()} (should be ${expectedStatus.toUpperCase()}) ✗`);
      }
    });
    
    console.log('\n' + '-'.repeat(60));
    logInfo(`Correct: ${correctCount}, Incorrect: ${incorrectCount}`);
    
    if (incorrectCount > 0) {
      log('\n⚠️  Some records have incorrect status. Run the SQL fix query.', 'yellow');
    }
    
    return incorrectCount === 0;
  } catch (err) {
    logError(`Exception: ${err.message}`);
    return false;
  }
}

// Test 5: Test Window Time Display
async function testWindowTimeDisplay() {
  logTest('Test Window Time Display Formatting');
  
  try {
    const { data: window } = await supabase
      .from('attendance_settings')
      .select('*')
      .eq('setting_name', 'default_attendance_window')
      .eq('is_active', true)
      .maybeSingle();
    
    if (!window) {
      logError('No window settings found');
      return false;
    }
    
    // Format time for display
    const formatTime = (timeString) => {
      const [hour, minute] = timeString.split(':').map(Number);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
    };
    
    const displayTime = `${formatTime(window.start_time)} - ${formatTime(window.end_time)}`;
    
    logSuccess('Window time formatted successfully');
    logInfo(`Display format: ${displayTime}`);
    
    return true;
  } catch (err) {
    logError(`Exception: ${err.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     GRACE PERIOD & ATTENDANCE SETTINGS TEST SUITE         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    passed: 0,
    failed: 0,
  };
  
  // Run all tests
  const tests = [
    { name: 'Fetch Window Settings', fn: testFetchWindowSettings },
    { name: 'Grace Period Calculation', fn: testGracePeriodCalculation },
    { name: 'Fetch Employee Data', fn: testFetchEmployeeData },
    { name: 'Verify Attendance Records', fn: testAttendanceRecords },
    { name: 'Window Time Display', fn: testWindowTimeDisplay },
  ];
  
  for (const test of tests) {
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Summary
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      TEST SUMMARY                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');
  
  if (results.failed === 0) {
    logSuccess(`All ${results.passed} tests passed! ✓`);
  } else {
    logError(`${results.failed} test(s) failed, ${results.passed} passed`);
  }
  
  console.log('');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  logError(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
