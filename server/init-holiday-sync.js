/**
 * Initialize Holiday Sync on Server Startup
 * This script runs once when the server starts to ensure holidays are synced
 */

const { supabase } = require('./supabase/client');

async function initHolidaySync() {
  console.log('[Holiday Init] Checking holiday sync status...');
  
  try {
    // Check if we have holidays for current year
    const currentYear = new Date().getFullYear();
    
    const { count, error } = await supabase
      .from('master_public_holidays')
      .select('*', { count: 'exact', head: true })
      .gte('holiday_date', `${currentYear}-01-01`)
      .lte('holiday_date', `${currentYear}-12-31`);

    if (error) {
      console.error('[Holiday Init] Error checking holidays:', error);
      return;
    }

    console.log(`[Holiday Init] Found ${count || 0} holidays for ${currentYear}`);
    
    if (!count || count === 0) {
      console.log('[Holiday Init] No holidays found, will sync on first API call');
    } else {
      console.log('[Holiday Init] Holidays already synced');
    }
    
  } catch (error) {
    console.error('[Holiday Init] Error during initialization:', error);
  }
}

// Run initialization
initHolidaySync();

module.exports = { initHolidaySync };