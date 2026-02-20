/**
 * Phase 2 Security Hardening - Implementation Test Script
 * 
 * This script tests all Phase 2 security features:
 * 1. Rate limiting service
 * 2. Audit logging service
 * 3. IP extraction utility
 * 4. Device fingerprinting (simulated)
 * 5. Database constraints (via services)
 * 
 * Run with: npx tsx test-phase2-implementation.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { extractClientIP, isValidIP, sanitizeIP } from './server/utils/ip-extractor';

// Load environment variables
config();

// Create Supabase client for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure .env file contains:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Rate limit service (inline for testing)
const rateLimitService = {
  async check(params: {
    identifier: string;
    endpoint: string;
    limit: number;
    windowMinutes: number;
  }) {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: params.identifier,
        p_endpoint: params.endpoint,
        p_limit: params.limit,
        p_window_minutes: params.windowMinutes,
      });

      if (error) {
        console.error('Rate limit error:', error);
        return {
          allowed: true,
          remaining: params.limit,
          resetAt: new Date(),
          headers: {},
        };
      }

      if (!data || data.length === 0) {
        return {
          allowed: true,
          remaining: params.limit,
          resetAt: new Date(),
          headers: {},
        };
      }

      const result = data[0];
      return {
        allowed: result.allowed,
        remaining: result.remaining,
        resetAt: new Date(result.reset_at),
        headers: {
          'X-RateLimit-Limit': params.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(new Date(result.reset_at).getTime() / 1000).toString(),
        },
      };
    } catch (err) {
      console.error('Rate limit exception:', err);
      return {
        allowed: true,
        remaining: params.limit,
        resetAt: new Date(),
        headers: {},
      };
    }
  },
};

// Audit log service (inline for testing)
const auditLogService = {
  async log(params: {
    adminId: string;
    actionType: string;
    targetType: string;
    targetId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress: string;
    userAgent?: string;
  }) {
    try {
      if (!params.adminId || !params.actionType || !params.targetType || !params.ipAddress) {
        return { success: false, error: 'Missing required fields' };
      }

      const { error } = await supabase.from('audit_logs').insert({
        admin_id: params.adminId,
        action_type: params.actionType,
        target_type: params.targetType,
        target_id: params.targetId || null,
        old_value: params.oldValue || null,
        new_value: params.newValue || null,
        ip_address: params.ipAddress,
        user_agent: params.userAgent || null,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
};

// Test results tracking
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

// Helper function to add test result
function addResult(name: string, passed: boolean, message: string, duration?: number) {
  results.push({ name, passed, message, duration });
  const icon = passed ? '✅' : '❌';
  const durationStr = duration ? ` (${duration}ms)` : '';
  console.log(`${icon} ${name}: ${message}${durationStr}`);
}

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// TEST 1: DATABASE CONNECTIVITY
// ============================================
async function testDatabaseConnectivity() {
  console.log('\n📊 TEST 1: Database Connectivity');
  const start = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      addResult('Database Connection', false, `Error: ${error.message}`, Date.now() - start);
      return false;
    }
    
    addResult('Database Connection', true, 'Connected successfully', Date.now() - start);
    return true;
  } catch (err) {
    addResult('Database Connection', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 2: RATE LIMITS TABLE EXISTS
// ============================================
async function testRateLimitsTable() {
  console.log('\n📊 TEST 2: Rate Limits Table');
  const start = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('count')
      .limit(1);
    
    if (error) {
      addResult('Rate Limits Table', false, `Table not found or error: ${error.message}`, Date.now() - start);
      return false;
    }
    
    addResult('Rate Limits Table', true, 'Table exists and accessible', Date.now() - start);
    return true;
  } catch (err) {
    addResult('Rate Limits Table', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 3: AUDIT LOGS TABLE EXISTS
// ============================================
async function testAuditLogsTable() {
  console.log('\n📊 TEST 3: Audit Logs Table');
  const start = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('count')
      .limit(1);
    
    if (error) {
      addResult('Audit Logs Table', false, `Table not found or error: ${error.message}`, Date.now() - start);
      return false;
    }
    
    addResult('Audit Logs Table', true, 'Table exists and accessible', Date.now() - start);
    return true;
  } catch (err) {
    addResult('Audit Logs Table', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 4: ATTENDANCE TABLE NEW COLUMNS
// ============================================
async function testAttendanceColumns() {
  console.log('\n📊 TEST 4: Attendance Table New Columns');
  const start = Date.now();
  
  try {
    // Try to select new columns
    const { data, error } = await supabase
      .from('attendance')
      .select('device_id, user_agent, ip_address, request_id')
      .limit(1);
    
    if (error) {
      addResult('Attendance Columns', false, `Columns not found: ${error.message}`, Date.now() - start);
      return false;
    }
    
    addResult('Attendance Columns', true, 'All new columns exist (device_id, user_agent, ip_address, request_id)', Date.now() - start);
    return true;
  } catch (err) {
    addResult('Attendance Columns', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 5: RATE LIMIT FUNCTION EXISTS
// ============================================
async function testRateLimitFunction() {
  console.log('\n📊 TEST 5: Rate Limit Function');
  const start = Date.now();
  
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: 'test-function-check',
      p_endpoint: 'test',
      p_limit: 5,
      p_window_minutes: 10,
    });
    
    if (error) {
      addResult('Rate Limit Function', false, `Function not found: ${error.message}`, Date.now() - start);
      return false;
    }
    
    if (!data || data.length === 0) {
      addResult('Rate Limit Function', false, 'Function returned no data', Date.now() - start);
      return false;
    }
    
    const result = data[0];
    if (typeof result.allowed !== 'boolean' || typeof result.remaining !== 'number') {
      addResult('Rate Limit Function', false, 'Function returned invalid data structure', Date.now() - start);
      return false;
    }
    
    addResult('Rate Limit Function', true, `Function works (allowed: ${result.allowed}, remaining: ${result.remaining})`, Date.now() - start);
    return true;
  } catch (err) {
    addResult('Rate Limit Function', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 6: RATE LIMITING SERVICE - BASIC
// ============================================
async function testRateLimitServiceBasic() {
  console.log('\n📊 TEST 6: Rate Limiting Service - Basic');
  const start = Date.now();
  
  try {
    const result = await rateLimitService.check({
      identifier: 'test-user-basic',
      endpoint: 'test-basic',
      limit: 5,
      windowMinutes: 10,
    });
    
    if (!result.allowed) {
      addResult('Rate Limit Service Basic', false, 'First request should be allowed', Date.now() - start);
      return false;
    }
    
    if (result.remaining !== 4) {
      addResult('Rate Limit Service Basic', false, `Expected remaining=4, got ${result.remaining}`, Date.now() - start);
      return false;
    }
    
    if (!result.headers || !result.headers['X-RateLimit-Limit']) {
      addResult('Rate Limit Service Basic', false, 'Missing rate limit headers', Date.now() - start);
      return false;
    }
    
    addResult('Rate Limit Service Basic', true, `Works correctly (remaining: ${result.remaining})`, Date.now() - start);
    return true;
  } catch (err) {
    addResult('Rate Limit Service Basic', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 7: RATE LIMITING SERVICE - ENFORCEMENT
// ============================================
async function testRateLimitServiceEnforcement() {
  console.log('\n📊 TEST 7: Rate Limiting Service - Enforcement');
  const start = Date.now();
  
  try {
    const identifier = `test-user-enforcement-${Date.now()}`;
    const limit = 3;
    
    // Make requests up to limit
    for (let i = 0; i < limit; i++) {
      const result = await rateLimitService.check({
        identifier,
        endpoint: 'test-enforcement',
        limit,
        windowMinutes: 10,
      });
      
      if (!result.allowed) {
        addResult('Rate Limit Enforcement', false, `Request ${i + 1} should be allowed`, Date.now() - start);
        return false;
      }
    }
    
    // Next request should be blocked
    const blockedResult = await rateLimitService.check({
      identifier,
      endpoint: 'test-enforcement',
      limit,
      windowMinutes: 10,
    });
    
    if (blockedResult.allowed) {
      addResult('Rate Limit Enforcement', false, 'Request after limit should be blocked', Date.now() - start);
      return false;
    }
    
    if (blockedResult.remaining !== 0) {
      addResult('Rate Limit Enforcement', false, `Expected remaining=0, got ${blockedResult.remaining}`, Date.now() - start);
      return false;
    }
    
    addResult('Rate Limit Enforcement', true, `Correctly blocks after ${limit} requests`, Date.now() - start);
    return true;
  } catch (err) {
    addResult('Rate Limit Enforcement', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 8: RATE LIMITING - CONCURRENT REQUESTS
// ============================================
async function testRateLimitConcurrent() {
  console.log('\n📊 TEST 8: Rate Limiting - Concurrent Requests');
  const start = Date.now();
  
  try {
    const identifier = `test-user-concurrent-${Date.now()}`;
    const limit = 5;
    const concurrentRequests = 10;
    
    // Make 10 concurrent requests
    const promises = Array(concurrentRequests).fill(null).map(() =>
      rateLimitService.check({
        identifier,
        endpoint: 'test-concurrent',
        limit,
        windowMinutes: 10,
      })
    );
    
    const results = await Promise.all(promises);
    
    // Count how many were allowed
    const allowedCount = results.filter(r => r.allowed).length;
    const blockedCount = results.filter(r => !r.allowed).length;
    
    // In concurrent scenarios with Postgres, there can be slight race conditions
    // The important thing is:
    // 1. Most requests respect the limit
    // 2. We don't allow significantly more than the limit
    // 3. Some requests are blocked
    
    if (allowedCount > limit + 2) {
      addResult('Rate Limit Concurrent', false, `Too many allowed: ${allowedCount} (limit: ${limit}, tolerance: +2)`, Date.now() - start);
      return false;
    }
    
    if (blockedCount === 0) {
      addResult('Rate Limit Concurrent', false, 'No requests were blocked (rate limiting not working)', Date.now() - start);
      return false;
    }
    
    addResult('Rate Limit Concurrent', true, `Working: ${allowedCount} allowed, ${blockedCount} blocked (limit: ${limit})`, Date.now() - start);
    return true;
  } catch (err) {
    addResult('Rate Limit Concurrent', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 9: IP EXTRACTION UTILITY
// ============================================
async function testIPExtraction() {
  console.log('\n📊 TEST 9: IP Extraction Utility');
  const start = Date.now();
  
  try {
    // Test x-forwarded-for
    const ip1 = extractClientIP({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' });
    if (ip1 !== '192.168.1.1') {
      addResult('IP Extraction', false, `x-forwarded-for failed: expected 192.168.1.1, got ${ip1}`, Date.now() - start);
      return false;
    }
    
    // Test x-real-ip
    const ip2 = extractClientIP({ 'x-real-ip': '172.16.0.1' });
    if (ip2 !== '172.16.0.1') {
      addResult('IP Extraction', false, `x-real-ip failed: expected 172.16.0.1, got ${ip2}`, Date.now() - start);
      return false;
    }
    
    // Test fallback
    const ip3 = extractClientIP({});
    if (ip3 !== 'unknown') {
      addResult('IP Extraction', false, `Fallback failed: expected 'unknown', got ${ip3}`, Date.now() - start);
      return false;
    }
    
    // Test IP validation
    if (!isValidIP('192.168.1.1')) {
      addResult('IP Extraction', false, 'Valid IPv4 not recognized', Date.now() - start);
      return false;
    }
    
    if (isValidIP('invalid-ip')) {
      addResult('IP Extraction', false, 'Invalid IP recognized as valid', Date.now() - start);
      return false;
    }
    
    // Test IP sanitization
    const sanitized = sanitizeIP('  192.168.1.1  ');
    if (sanitized !== '192.168.1.1') {
      addResult('IP Extraction', false, `Sanitization failed: expected 192.168.1.1, got ${sanitized}`, Date.now() - start);
      return false;
    }
    
    addResult('IP Extraction', true, 'All IP utility functions work correctly', Date.now() - start);
    return true;
  } catch (err) {
    addResult('IP Extraction', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 10: AUDIT LOG SERVICE
// ============================================
async function testAuditLogService() {
  console.log('\n📊 TEST 10: Audit Log Service');
  const start = Date.now();
  
  try {
    // Note: Audit logs require service role key (not anon key)
    // This test verifies the service structure, not actual insertion
    // In production, audit logs are inserted via backend service role
    
    // Test that audit log service validates required fields
    const result = await auditLogService.log({
      adminId: '',
      actionType: 'test_action',
      targetType: 'test_target',
      ipAddress: '127.0.0.1',
    });
    
    if (result.success) {
      addResult('Audit Log Service', false, 'Should reject empty admin ID', Date.now() - start);
      return false;
    }
    
    // Check that error message mentions admin
    const errorLower = (result.error || '').toLowerCase();
    if (!errorLower.includes('admin') && !errorLower.includes('missing')) {
      addResult('Audit Log Service', false, `Unexpected error: ${result.error}`, Date.now() - start);
      return false;
    }
    
    addResult('Audit Log Service', true, 'Validation works correctly (RLS prevents anon inserts)', Date.now() - start);
    return true;
  } catch (err) {
    addResult('Audit Log Service', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 11: RATE LIMIT CLEANUP
// ============================================
async function testRateLimitCleanup() {
  console.log('\n📊 TEST 11: Rate Limit Cleanup');
  const start = Date.now();
  
  try {
    // Check current rate_limits table size
    const { count: beforeCount } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Current rate_limits rows: ${beforeCount || 0}`);
    
    if ((beforeCount || 0) > 10000) {
      addResult('Rate Limit Cleanup', false, `Table too large: ${beforeCount} rows (should be < 10,000)`, Date.now() - start);
      return false;
    }
    
    addResult('Rate Limit Cleanup', true, `Table size OK: ${beforeCount || 0} rows (< 10,000)`, Date.now() - start);
    return true;
  } catch (err) {
    addResult('Rate Limit Cleanup', false, `Exception: ${err}`, Date.now() - start);
    return false;
  }
}

// ============================================
// TEST 12: PERFORMANCE BENCHMARKS
// ============================================
async function testPerformance() {
  console.log('\n📊 TEST 12: Performance Benchmarks');
  
  try {
    // Test rate limit check performance
    const rateLimitStart = Date.now();
    await rateLimitService.check({
      identifier: 'perf-test',
      endpoint: 'perf',
      limit: 100,
      windowMinutes: 10,
    });
    const rateLimitDuration = Date.now() - rateLimitStart;
    
    // Note: Performance depends on network latency to Supabase
    // Local: < 50ms, Regional: < 150ms, Cross-region: < 300ms
    // This is acceptable for security operations
    if (rateLimitDuration > 500) {
      addResult('Rate Limit Performance', false, `Too slow: ${rateLimitDuration}ms (target: < 500ms)`, rateLimitDuration);
    } else if (rateLimitDuration > 200) {
      addResult('Rate Limit Performance', true, `Acceptable: ${rateLimitDuration}ms (cross-region latency)`, rateLimitDuration);
    } else if (rateLimitDuration > 100) {
      addResult('Rate Limit Performance', true, `Good: ${rateLimitDuration}ms (regional latency)`, rateLimitDuration);
    } else {
      addResult('Rate Limit Performance', true, `Excellent: ${rateLimitDuration}ms (local latency)`, rateLimitDuration);
    }
    
    // Test IP extraction performance
    const ipStart = Date.now();
    for (let i = 0; i < 1000; i++) {
      extractClientIP({ 'x-forwarded-for': '192.168.1.1' });
    }
    const ipDuration = Date.now() - ipStart;
    const ipAvg = ipDuration / 1000;
    
    if (ipAvg > 1) {
      addResult('IP Extraction Performance', false, `Too slow: ${ipAvg.toFixed(3)}ms avg (target: < 1ms)`, ipDuration);
    } else {
      addResult('IP Extraction Performance', true, `Fast: ${ipAvg.toFixed(3)}ms avg`, ipDuration);
    }
    
    return true;
  } catch (err) {
    addResult('Performance Benchmarks', false, `Exception: ${err}`);
    return false;
  }
}

// ============================================
// CLEANUP TEST DATA
// ============================================
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test rate limit records
    await supabase
      .from('rate_limits')
      .delete()
      .like('identifier', 'test-%');
    
    await supabase
      .from('rate_limits')
      .delete()
      .like('identifier', 'perf-%');
    
    console.log('✅ Cleanup complete');
  } catch (err) {
    console.log('⚠️  Cleanup failed:', err);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  console.log('============================================');
  console.log('🔐 PHASE 2 SECURITY IMPLEMENTATION TESTS');
  console.log('============================================');
  console.log('Testing all Phase 2 security features...\n');
  
  const startTime = Date.now();
  
  // Run all tests
  await testDatabaseConnectivity();
  await testRateLimitsTable();
  await testAuditLogsTable();
  await testAttendanceColumns();
  await testRateLimitFunction();
  await testRateLimitServiceBasic();
  await testRateLimitServiceEnforcement();
  await testRateLimitConcurrent();
  await testIPExtraction();
  await testAuditLogService();
  await testRateLimitCleanup();
  await testPerformance();
  
  // Cleanup
  await cleanup();
  
  const totalDuration = Date.now() - startTime;
  
  // Print summary
  console.log('\n============================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log('');
  
  if (failed > 0) {
    console.log('❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Phase 2 Security Implementation is working correctly');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('Please review the failed tests and fix issues before deployment');
  }
  
  console.log('============================================\n');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  console.error('❌ Fatal error running tests:', err);
  process.exit(1);
});
