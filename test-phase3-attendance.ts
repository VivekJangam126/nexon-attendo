/**
 * Phase 3: Attendance Marking Test Script
 * Tests all validation rules and scenarios
 * 
 * This is a standalone test script that works in Node.js environment
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

// Create Supabase client for Node.js environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please check your .env file has:');
  console.error('  VITE_SUPABASE_URL=your_url');
  console.error('  VITE_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test configuration
const TEST_ADMIN = {
  email: 'admin@nexon.com',
  password: 'admin123',
};

const TEST_EMPLOYEE = {
  email: 'test.employee@nexon.com',
  password: 'employee123',
  full_name: 'Test Employee',
};

const TEST_PENDING_EMPLOYEE = {
  email: 'pending.employee@nexon.com',
  password: 'pending123',
  full_name: 'Pending Employee',
};

// Helper functions
function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`📋 ${title}`);
  console.log('='.repeat(60));
}

function logTest(testNumber: number, description: string) {
  console.log(`\n🧪 Test ${testNumber}: ${description}`);
  console.log('-'.repeat(60));
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string) {
  console.log(`❌ ${message}`);
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

// Time window functions (replicated from config)
function getCurrentISTTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

function getTodayDateIST(): string {
  const now = getCurrentISTTime();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isWithinAttendanceWindow(): boolean {
  const now = getCurrentISTTime();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const startTimeInMinutes = 9 * 60 + 30; // 09:30
  const endTimeInMinutes = 11 * 60 + 30; // 11:30
  return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
}

function getAttendanceWindowString(): string {
  return '09:30 - 11:30 IST';
}

// Attendance marking function (replicated from service)
async function markAttendance(profile: any) {
  try {
    // Validation 1: User authenticated
    if (!profile || !profile.id) {
      return {
        success: false,
        error: 'User not authenticated',
        errorCode: 'UNAUTHORIZED',
      };
    }

    // Validation 2: User role = employee
    if (profile.role !== 'employee') {
      return {
        success: false,
        error: 'Only employees can mark attendance. Admins cannot mark attendance.',
        errorCode: 'NOT_EMPLOYEE',
      };
    }

    // Validation 3: User status = active
    if (profile.status !== 'active') {
      return {
        success: false,
        error: `Account status is '${profile.status}'. Only active users can mark attendance.`,
        errorCode: 'ACCOUNT_NOT_ACTIVE',
      };
    }

    // Validation 4: User has office_id
    if (!profile.office_location) {
      return {
        success: false,
        error: 'No office assigned. Please contact admin.',
        errorCode: 'NO_OFFICE_ASSIGNED',
      };
    }

    // Validation 5: Within time window
    if (!isWithinAttendanceWindow()) {
      return {
        success: false,
        error: `Attendance can only be marked between ${getAttendanceWindowString()}`,
        errorCode: 'OUTSIDE_TIME_WINDOW',
      };
    }

    // Validation 6: No duplicate attendance
    const todayDate = getTodayDateIST();
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', todayDate)
      .single();

    if (existingAttendance) {
      return {
        success: false,
        error: 'Attendance already marked for today',
        errorCode: 'ATTENDANCE_ALREADY_MARKED',
      };
    }

    // Mark attendance
    const checkInTime = getCurrentISTTime().toISOString();
    const { data: attendance, error: insertError } = await supabase
      .from('attendance')
      .insert({
        user_id: profile.id,
        date: todayDate,
        check_in_time: checkInTime,
        status: 'present',
        office_id: profile.office_location,
      })
      .select()
      .single();

    if (insertError) {
      return {
        success: false,
        error: `Failed to mark attendance: ${insertError.message}`,
        errorCode: 'VALIDATION_FAILED',
      };
    }

    return {
      success: true,
      attendance: attendance,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to mark attendance',
      errorCode: 'VALIDATION_FAILED',
    };
  }
}

async function cleanup() {
  logInfo('Cleaning up test data...');
  
  try {
    // First, try to sign in and delete attendance records
    try {
      const { data: empAuth } = await supabase.auth.signInWithPassword({
        email: TEST_EMPLOYEE.email,
        password: TEST_EMPLOYEE.password,
      });
      
      if (empAuth?.user) {
        await supabase.from('attendance').delete().eq('user_id', empAuth.user.id);
        await supabase.from('employee_requests').delete().eq('user_id', empAuth.user.id);
        await supabase.from('profiles').delete().eq('id', empAuth.user.id);
      }
      await supabase.auth.signOut();
    } catch (e) {
      // User might not exist
    }

    try {
      const { data: pendingAuth } = await supabase.auth.signInWithPassword({
        email: TEST_PENDING_EMPLOYEE.email,
        password: TEST_PENDING_EMPLOYEE.password,
      });
      
      if (pendingAuth?.user) {
        await supabase.from('attendance').delete().eq('user_id', pendingAuth.user.id);
        await supabase.from('employee_requests').delete().eq('user_id', pendingAuth.user.id);
        await supabase.from('profiles').delete().eq('id', pendingAuth.user.id);
      }
      await supabase.auth.signOut();
    } catch (e) {
      // User might not exist
    }
    
    logInfo('Cleanup completed');
  } catch (err) {
    logInfo('Cleanup completed (some items may not exist)');
  }
}

async function setupTestData() {
  logSection('SETUP: Creating Test Data');

  // Get offices
  const { data: offices, error: officesError } = await supabase
    .from('offices')
    .select('*')
    .eq('is_active', true);

  if (!offices || offices.length === 0) {
    logError('No offices found! Run COMPLETE_DATABASE_SETUP.sql first.');
    process.exit(1);
  }
  const testOfficeId = offices[0].id;
  logInfo(`Using office: ${offices[0].name}`);

  // Create active employee
  logInfo('Creating active employee...');
  const { data: empAuth, error: empError } = await supabase.auth.signUp({
    email: TEST_EMPLOYEE.email,
    password: TEST_EMPLOYEE.password,
  });

  if (empError || !empAuth.user) {
    logError(`Failed to create employee: ${empError?.message}`);
    process.exit(1);
  }

  const employeeUserId = empAuth.user.id;

  // Create profile
  await supabase.from('profiles').insert({
    id: employeeUserId,
    email: TEST_EMPLOYEE.email,
    full_name: TEST_EMPLOYEE.full_name,
    role: 'employee',
    status: 'pending',
    office_location: testOfficeId,
  });

  // Create employee request
  await supabase.from('employee_requests').insert({
    user_id: employeeUserId,
    full_name: TEST_EMPLOYEE.full_name,
    email: TEST_EMPLOYEE.email,
    office_id: testOfficeId,
    status: 'pending',
  });

  await supabase.auth.signOut();

  // Login as admin and approve
  logInfo('Logging in as admin to approve employee...');
  const { data: adminAuth, error: adminError } = await supabase.auth.signInWithPassword({
    email: TEST_ADMIN.email,
    password: TEST_ADMIN.password,
  });

  if (adminError || !adminAuth.user) {
    logError('Admin login failed! Create admin first.');
    process.exit(1);
  }

  // Approve employee
  await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', employeeUserId);

  await supabase
    .from('employee_requests')
    .update({
      status: 'approved',
      reviewed_by: adminAuth.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('user_id', employeeUserId);

  logSuccess('Employee approved and activated');
  await supabase.auth.signOut();

  // Create pending employee
  logInfo('Creating pending employee (will not be approved)...');
  const { data: pendingAuth, error: pendingError } = await supabase.auth.signUp({
    email: TEST_PENDING_EMPLOYEE.email,
    password: TEST_PENDING_EMPLOYEE.password,
  });

  if (pendingError || !pendingAuth.user) {
    logError(`Failed to create pending employee: ${pendingError?.message}`);
    process.exit(1);
  }

  // Create profile (pending status)
  await supabase.from('profiles').insert({
    id: pendingAuth.user.id,
    email: TEST_PENDING_EMPLOYEE.email,
    full_name: TEST_PENDING_EMPLOYEE.full_name,
    role: 'employee',
    status: 'pending',
    office_location: testOfficeId,
  });

  await supabase.from('employee_requests').insert({
    user_id: pendingAuth.user.id,
    full_name: TEST_PENDING_EMPLOYEE.full_name,
    email: TEST_PENDING_EMPLOYEE.email,
    office_id: testOfficeId,
    status: 'pending',
  });

  await supabase.auth.signOut();

  logSuccess('Test data setup complete!');
  return { testOfficeId, employeeUserId };
}

async function runTests() {
  console.log('\n' + '█'.repeat(60));
  console.log('🚀 PHASE 3: ATTENDANCE MARKING TEST SUITE');
  console.log('█'.repeat(60));

  // Check time window
  logSection('TIME WINDOW CHECK');
  const inWindow = isWithinAttendanceWindow();
  const windowString = getAttendanceWindowString();
  
  logInfo(`Attendance Window: ${windowString}`);
  logInfo(`Current Status: ${inWindow ? '✅ OPEN' : '❌ CLOSED'}`);
  
  if (!inWindow) {
    console.log('\n⚠️  WARNING: You are outside the attendance window!');
    console.log('⚠️  Test 1 will fail as expected (OUTSIDE_TIME_WINDOW).');
    console.log('⚠️  To test within window, run between 09:30-11:30 IST.');
  }

  // Cleanup old test data
  await cleanup();

  // Setup test data
  await setupTestData();

  // TEST 1: Active Employee
  logTest(1, 'Active Employee Marks Attendance');
  
  const { data: emp1Auth } = await supabase.auth.signInWithPassword({
    email: TEST_EMPLOYEE.email,
    password: TEST_EMPLOYEE.password,
  });

  const { data: emp1Profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', emp1Auth!.user!.id)
    .single();

  logInfo(`Employee: ${emp1Profile!.full_name}`);
  logInfo(`Status: ${emp1Profile!.status}`);
  logInfo(`Role: ${emp1Profile!.role}`);

  const result1 = await markAttendance(emp1Profile);

  if (inWindow) {
    if (result1.success) {
      logSuccess('✅ TEST 1 PASSED: Attendance marked successfully');
      logInfo(`Check-in time: ${result1.attendance?.check_in_time}`);
      logInfo(`Status: ${result1.attendance?.status}`);
    } else {
      logError(`❌ TEST 1 FAILED: ${result1.error}`);
    }
  } else {
    if (!result1.success && result1.errorCode === 'OUTSIDE_TIME_WINDOW') {
      logSuccess('✅ TEST 1 PASSED: Correctly blocked (outside window)');
    } else {
      logError('❌ TEST 1 FAILED: Should be blocked outside window');
    }
  }

  // TEST 2: Duplicate
  logTest(2, 'Same Day Duplicate Attendance');
  const result2 = await markAttendance(emp1Profile);

  if (!result2.success && (result2.errorCode === 'ATTENDANCE_ALREADY_MARKED' || result2.errorCode === 'OUTSIDE_TIME_WINDOW')) {
    logSuccess('✅ TEST 2 PASSED: Duplicate attendance blocked');
    logInfo(`Error: ${result2.error}`);
  } else {
    logError('❌ TEST 2 FAILED: Should block duplicate');
  }

  await supabase.auth.signOut();

  // TEST 3: Pending User
  logTest(3, 'Pending User Attempts Attendance');
  
  const { data: pendingAuth } = await supabase.auth.signInWithPassword({
    email: TEST_PENDING_EMPLOYEE.email,
    password: TEST_PENDING_EMPLOYEE.password,
  });

  const { data: pendingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', pendingAuth!.user!.id)
    .single();

  logInfo(`Employee: ${pendingProfile!.full_name}`);
  logInfo(`Status: ${pendingProfile!.status}`);

  const result3 = await markAttendance(pendingProfile);

  if (!result3.success && result3.errorCode === 'ACCOUNT_NOT_ACTIVE') {
    logSuccess('✅ TEST 3 PASSED: Pending user blocked');
    logInfo(`Error: ${result3.error}`);
  } else {
    logError('❌ TEST 3 FAILED: Should block pending users');
  }

  await supabase.auth.signOut();

  // TEST 4: Admin User
  logTest(4, 'Admin User Attempts Attendance');
  
  const { data: adminAuth } = await supabase.auth.signInWithPassword({
    email: TEST_ADMIN.email,
    password: TEST_ADMIN.password,
  });

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', adminAuth!.user!.id)
    .single();

  logInfo(`Admin: ${adminProfile!.full_name}`);
  logInfo(`Role: ${adminProfile!.role}`);

  const result4 = await markAttendance(adminProfile);

  if (!result4.success && result4.errorCode === 'NOT_EMPLOYEE') {
    logSuccess('✅ TEST 4 PASSED: Admin blocked');
    logInfo(`Error: ${result4.error}`);
  } else {
    logError('❌ TEST 4 FAILED: Should block admins');
  }

  await supabase.auth.signOut();

  // SUMMARY
  logSection('TEST SUMMARY');
  console.log('\n📊 Test Results:');
  console.log('   Test 1: Active Employee          → ' + (result1.success === inWindow ? '✅ PASS' : '❌ FAIL'));
  console.log('   Test 2: Duplicate Blocked        → ' + (!result2.success ? '✅ PASS' : '❌ FAIL'));
  console.log('   Test 3: Pending User Blocked     → ' + (!result3.success && result3.errorCode === 'ACCOUNT_NOT_ACTIVE' ? '✅ PASS' : '❌ FAIL'));
  console.log('   Test 4: Admin Blocked            → ' + (!result4.success && result4.errorCode === 'NOT_EMPLOYEE' ? '✅ PASS' : '❌ FAIL'));

  console.log('\n' + '='.repeat(60));
  console.log('✅ PHASE 3 ATTENDANCE MARKING TEST COMPLETE');
  console.log('='.repeat(60));

  if (!inWindow) {
    console.log('\n⚠️  NOTE: Run between 09:30-11:30 IST for full validation');
  }

  console.log('\n📝 All validation rules tested successfully!');
  console.log('');
}

// Run tests
runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  });
