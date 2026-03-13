/**
 * Check what holidays exist in the database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY5MTg1NCwiZXhwIjoyMDg2MjY3ODU0fQ.846KQ7v9nbH5-4COTqEgBGrboFFKrTG7w3AGPP4uIq';

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
