/**
 * Holiday Sync Service
 * Automatically syncs holidays from Google Calendar API to database
 */

import { supabase } from '../supabase/client';
import { googleCalendarService } from './google-calendar.service';

export class HolidaySyncService {
  constructor() {
    // Ensure this only runs on server-side
    if (typeof window !== 'undefined') {
      console.warn('[Holiday Sync] This service should only run on server-side');
      return;
    }
  }

  /**
   * Sync holidays for current and next year
   */
  async syncHolidays(): Promise<void> {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    console.log('[Holiday Sync] Starting holiday sync process...');

    try {
      // Sync current year holidays
      await this.syncYearHolidays(currentYear);
      
      // Sync next year holidays
      await this.syncYearHolidays(nextYear);

      console.log('[Holiday Sync] Holiday sync completed successfully');
    } catch (error) {
      console.error('[Holiday Sync] Error during sync:', error);
      throw error;
    }
  }

  /**
   * Sync holidays for a specific year
   */
  private async syncYearHolidays(year: number): Promise<void> {
    console.log(`[Holiday Sync] Syncing holidays for ${year}...`);

    try {
      // Check if holidays already exist for this year
      const { data: existingHolidays, error: checkError } = await supabase
        .from('master_public_holidays')
        .select('holiday_date')
        .gte('holiday_date', `${year}-01-01`)
        .lte('holiday_date', `${year}-12-31`)
        .limit(1);

      if (checkError) {
        console.error(`[Holiday Sync] Error checking existing holidays for ${year}:`, checkError);
        throw checkError;
      }

      // Skip if holidays already exist (unless it's a forced refresh)
      if (existingHolidays && existingHolidays.length > 0) {
        console.log(`[Holiday Sync] Holidays for ${year} already exist, skipping...`);
        return;
      }

      // Fetch holidays from Google Calendar API
      const holidays = await googleCalendarService.fetchYearHolidays(year);

      if (holidays.length === 0) {
        console.warn(`[Holiday Sync] No holidays fetched for ${year}`);
        return;
      }

      // Prepare data for database insertion
      const holidayData = holidays.map(holiday => ({
        holiday_date: holiday.date,
        holiday_name: holiday.name,
        holiday_type: holiday.type,
        description: holiday.description || holiday.name,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insert holidays into database
      const { error: insertError } = await supabase
        .from('master_public_holidays')
        .insert(holidayData);

      if (insertError) {
        console.error(`[Holiday Sync] Error inserting holidays for ${year}:`, insertError);
        throw insertError;
      }

      console.log(`[Holiday Sync] Successfully synced ${holidays.length} holidays for ${year}`);

    } catch (error) {
      console.error(`[Holiday Sync] Error syncing holidays for ${year}:`, error);
      throw error;
    }
  }

  /**
   * Force refresh holidays for a specific year
   */
  async forceRefreshYear(year: number): Promise<void> {
    console.log(`[Holiday Sync] Force refreshing holidays for ${year}...`);

    try {
      // Delete existing holidays for the year
      const { error: deleteError } = await supabase
        .from('master_public_holidays')
        .delete()
        .gte('holiday_date', `${year}-01-01`)
        .lte('holiday_date', `${year}-12-31`);

      if (deleteError) {
        console.error(`[Holiday Sync] Error deleting existing holidays for ${year}:`, deleteError);
        throw deleteError;
      }

      // Sync fresh holidays
      await this.syncYearHolidays(year);

      console.log(`[Holiday Sync] Force refresh completed for ${year}`);
    } catch (error) {
      console.error(`[Holiday Sync] Error during force refresh for ${year}:`, error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    currentYear: { year: number; count: number; lastSync?: string };
    nextYear: { year: number; count: number; lastSync?: string };
  }> {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    try {
      // Get current year holiday count
      const { count: currentCount, error: currentError } = await supabase
        .from('master_public_holidays')
        .select('*', { count: 'exact', head: true })
        .gte('holiday_date', `${currentYear}-01-01`)
        .lte('holiday_date', `${currentYear}-12-31`);

      // Get next year holiday count
      const { count: nextCount, error: nextError } = await supabase
        .from('master_public_holidays')
        .select('*', { count: 'exact', head: true })
        .gte('holiday_date', `${nextYear}-01-01`)
        .lte('holiday_date', `${nextYear}-12-31`);

      if (currentError || nextError) {
        console.error('[Holiday Sync] Error getting sync status:', currentError || nextError);
      }

      return {
        currentYear: {
          year: currentYear,
          count: currentCount || 0
        },
        nextYear: {
          year: nextYear,
          count: nextCount || 0
        }
      };
    } catch (error) {
      console.error('[Holiday Sync] Error getting sync status:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic sync (called by cron job)
   */
  async scheduledSync(): Promise<void> {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    console.log(`[Holiday Sync] Scheduled sync triggered for month ${currentMonth}`);

    try {
      // Always ensure current year is synced
      await this.syncHolidays();

      // In October, prepare next year's holidays early
      if (currentMonth === 10) {
        const nextYear = new Date().getFullYear() + 1;
        console.log(`[Holiday Sync] October detected, ensuring ${nextYear} holidays are ready`);
        await this.syncYearHolidays(nextYear);
      }

    } catch (error) {
      console.error('[Holiday Sync] Scheduled sync failed:', error);
      // Don't throw - let the system continue working with existing data
    }
  }
}

export const holidaySyncService = new HolidaySyncService();