/**
 * Cron Scheduler Service
 * 
 * NOTE: This service is for reference only.
 * The actual auto-checkout cron is scheduled directly in Supabase
 * as an Edge Function with a cron trigger.
 * 
 * The cron runs every 5 minutes and checks if it's time to perform
 * auto-checkout based on admin-configured settings.
 */

export const cronSchedulerService = {
  /**
   * Get information about the auto-checkout cron schedule
   */
  getScheduleInfo: () => {
    return {
      schedule: '*/5 * * * *', // Every 5 minutes
      description: 'Auto-checkout cron runs every 5 minutes and checks if current time matches admin-configured checkout time',
      location: 'Supabase Edge Function: auto-checkout-cron',
      configuredIn: 'Supabase Dashboard > Edge Functions > auto-checkout-cron',
    };
  },
};
