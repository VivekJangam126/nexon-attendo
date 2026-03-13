/**
 * Holiday Sync Startup Script
 * Initializes the automatic holiday sync system
 */

import { cronHolidaySyncService } from '../services/cron-holiday-sync.service';
import { holidaySyncService } from '../services/holiday-sync.service';

/**
 * Initialize holiday sync system
 */
export async function initializeHolidaySync(): Promise<void> {
  console.log('[Holiday Sync Startup] Initializing holiday sync system...');

  try {
    // Check current sync status
    const status = await holidaySyncService.getSyncStatus();
    console.log('[Holiday Sync Startup] Current status:', status);

    // If no holidays exist for current year, sync immediately
    if (status.currentYear.count === 0) {
      console.log('[Holiday Sync Startup] No holidays found for current year, syncing now...');
      await holidaySyncService.syncHolidays();
    }

    // Start the cron job for automatic syncing
    cronHolidaySyncService.start();

    console.log('[Holiday Sync Startup] Holiday sync system initialized successfully');
  } catch (error) {
    console.error('[Holiday Sync Startup] Failed to initialize holiday sync system:', error);
    // Don't throw - let the application start even if holiday sync fails
  }
}

/**
 * Shutdown holiday sync system
 */
export function shutdownHolidaySync(): void {
  console.log('[Holiday Sync Startup] Shutting down holiday sync system...');
  cronHolidaySyncService.stop();
  console.log('[Holiday Sync Startup] Holiday sync system shut down');
}

// Auto-initialize when this module is imported (server-side only)
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  // Only run on server-side with Node.js process
  initializeHolidaySync().catch(error => {
    console.error('[Holiday Sync Startup] Auto-initialization failed:', error);
  });
}