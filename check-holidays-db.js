/**
 * Check what holidays exist in the database
 */

import { createClient } from '@supabase/supabase-js';

// Load from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkHolidays() {
  console.log('\n🔍 Checking holidays in database...\n');

  // Check 2026 holidays
  const { data: holidays2026, error: error2026, count: count2026 } = await supabase
    .from('master_public_holidays')
    .select('*', { count: 'exact' })
    .gte('holiday_date', '2026-01-01')
    .lte('holiday_date', '2026-12-31');

  console.log('📅 2026 Holidays:');
  console.log(`   Count: ${count2026 || 0}`);
  if (error2026) {
    console.log(`   ❌ Error:`, error2026.message);
  } else if (holidays2026 && holidays2026.length > 0) {
    console.log(`   ✅ First 5 holidays:`);
    holidays2026.slice(0, 5).forEach(h => {
      console.log(`      ${h.holiday_date} - ${h.holiday_name}`);
    });
  }

  // Check 2027 holidays
  const { data: holidays2027, error: error2027, count: count2027 } = await supabase
    .from('master_public_holidays')
    .select('*', { count: 'exact' })
    .gte('holiday_date', '2027-01-01')
    .lte('holiday_date', '2027-12-31');

  console.log('\n📅 2027 Holidays:');
  console.log(`   Count: ${count2027 || 0}`);
  if (error2027) {
    console.log(`   ❌ Error:`, error2027.message);
  } else if (holidays2027 && holidays2027.length > 0) {
    console.log(`   ✅ First 5 holidays:`);
    holidays2027.slice(0, 5).forEach(h => {
      console.log(`      ${h.holiday_date} - ${h.holiday_name}`);
    });
  }

  // Check all holidays
  const { count: totalCount } = await supabase
    .from('master_public_holidays')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total holidays in database: ${totalCount || 0}\n`);
}

checkHolidays();
