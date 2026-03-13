/**
 * Cron Job Service for Holiday Sync
 * Automatically runs holiday sync at scheduled intervals
 */

import { holidaySyncService } from './holiday-sync.service';

export class CronHolidaySyncService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the cron job
   * Runs every day at 2 AM to check and sync holidays
   */
  start(): void {
    if (this.isRunning) {
      console.log('[Cron Holiday Sync] Already running');
      return;
    }

    console.log('[Cron Holiday Sync] Starting holiday sync cron job...');
    
    // Run immediately on startup
    this.runSync();

    // Schedule to run every 24 hours (86400000 ms)
    this.intervalId = setInterval(() => {
      this.runSync();
    }, 24 * 60 * 60 * 1000);

    this.isRunning = true;
    console.log('[Cron Holiday Sync] Cron job started - will run every 24 hours');
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('[Cron Holiday Sync] Cron job stopped');
  }

  /**
   * Run the sync process
   */
  private async runSync(): Promise<void> {
    const now = new Date();
    console.log(`[Cron Holiday Sync] Running scheduled sync at ${now.toISOString()}`);

    try {
      await holidaySyncService.scheduledSync();
      console.log('[Cron Holiday Sync] Scheduled sync completed successfully');
    } catch (error) {
      console.error('[Cron Holiday Sync] Scheduled sync failed:', error);
      // Don't throw - let the cron continue running
    }
  }

  /**
   * Get cron job status
   */
  getStatus(): { isRunning: boolean; nextRun?: string } {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? 
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : 
        undefined
    };
  }

  /**
   * Run sync manually (for testing)
   */
  async runManual(): Promise<void> {
    console.log('[Cron Holiday Sync] Running manual sync...');
    await this.runSync();
  }
}

export const cronHolidaySyncService = new CronHolidaySyncService();