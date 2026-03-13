/**
 * Automatic Holiday Sync Service
 * Fetches accurate holidays from Google Calendar API for any year
 */

import { supabase } from '../supabase/client';

interface GoogleCalendarEvent {
  summary: string;
  start: { date: string };
  description?: string;
}

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[];
}

export class AutoHolidaySyncService {
  /**
   * Fetch holidays from Google Calendar API for a specific year
   */
  private async fetchGoogleCalendarHolidays(year: number) {
    const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
    
    if (!API_KEY) {
      console.warn('[Auto Sync] Google Calendar API key not configured, using fallback');
      return this.getFallbackHolidays(year);
    }

    try {
      const INDIAN_HOLIDAYS_CALENDAR = 'en.indian%23holiday%40group.v.calendar.google.com';
      const timeMin = `${year}-01-01T00:00:00Z`;
      const timeMax = `${year}-12-31T23:59:59Z`;
      
      const url = `https://www.googleapis.com/calendar/v3/calendars/${INDIAN_HOLIDAYS_CALENDAR}/events?` +
        `timeMin=${timeMin}&timeMax=${timeMax}&key=${API_KEY}&singleEvents=true&orderBy=startTime`;

      console.log(`[Auto Sync] Fetching holidays from Google Calendar for ${year}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[Auto Sync] Google API error: ${response.status}`);
        return this.getFallbackHolidays(year);
      }

      const data: GoogleCalendarResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.warn(`[Auto Sync] No holidays found for ${year}, using fallback`);
        return this.getFallbackHolidays(year);
      }

      const holidays = data.items.map(event => ({
        holiday_date: event.start.date,
        holiday_name: event.summary,
        holiday_type: this.categorizeHoliday(event.summary),
        description: event.description || event.summary,
        is_active: true
      }));

      console.log(`[Auto Sync] Fetched ${holidays.length} holidays for ${year} from Google Calendar`);
      return holidays;
      
    } catch (error) {
      console.error('[Auto Sync] Error fetching from Google Calendar:', error);
      return this.getFallbackHolidays(year);
    }
  }

  /**
   * Categorize holiday type based on name
   */
  private categorizeHoliday(name: string): 'public_holiday' | 'festival' {
    const publicHolidays = [
      'Republic Day', 'Independence Day', 'Gandhi Jayanti', 
      'New Year', 'Christmas', 'Good Friday'
    ];
    
    if (publicHolidays.some(holiday => name.toLowerCase().includes(holiday.toLowerCase()))) {
      return 'public_holiday';
    }
    
    return 'festival';
  }

  /**
   * Fallback holidays when API is unavailable
   */
  private getFallbackHolidays(year: number) {
    return [
      { holiday_date: `${year}-01-01`, holiday_name: 'New Year\'s Day', holiday_type: 'public_holiday' as const, description: 'New Year\'s Day', is_active: true },
      { holiday_date: `${year}-01-26`, holiday_name: 'Republic Day', holiday_type: 'public_holiday' as const, description: 'Republic Day of India', is_active: true },
      { holiday_date: `${year}-08-15`, holiday_name: 'Independence Day', holiday_type: 'public_holiday' as const, description: 'Independence Day of India', is_active: true },
      { holiday_date: `${year}-10-02`, holiday_name: 'Gandhi Jayanti', holiday_type: 'public_holiday' as const, description: 'Mahatma Gandhi Birthday', is_active: true },
      { holiday_date: `${year}-12-25`, holiday_name: 'Christmas Day', holiday_type: 'public_holiday' as const, description: 'Christmas Day', is_active: true },
    ];
  }

  /**
   * Auto-sync holidays for current and next year
   */
  async autoSync(): Promise<void> {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    console.log(`[Auto Sync] Checking holidays for ${currentYear} and ${nextYear}...`);
    
    await this.syncYear(currentYear);
    await this.syncYear(nextYear);
  }

  /**
   * Sync holidays for any specific year
   */
  private async syncYear(year: number): Promise<void> {
    try {
      // Check if holidays exist for this year
      const { count } = await supabase
        .from('master_public_holidays')
        .select('*', { count: 'exact', head: true })
        .gte('holiday_date', `${year}-01-01`)
        .lte('holiday_date', `${year}-12-31`);

      if (count && count > 0) {
        console.log(`[Auto Sync] ${year} already has ${count} holidays`);
        return;
      }

      // Fetch holidays from Google Calendar API
      const holidays = await this.fetchGoogleCalendarHolidays(year);
      
      if (holidays.length === 0) {
        console.warn(`[Auto Sync] No holidays to sync for ${year}`);
        return;
      }

      // Insert holidays
      const { error } = await supabase
        .from('master_public_holidays')
        .insert(holidays);

      if (error) {
        console.error(`[Auto Sync] Error syncing ${year}:`, error);
      } else {
        console.log(`[Auto Sync] Successfully synced ${holidays.length} holidays for ${year}`);
      }
    } catch (error) {
      console.error(`[Auto Sync] Exception syncing ${year}:`, error);
    }
  }
}

export const autoHolidaySyncService = new AutoHolidaySyncService();