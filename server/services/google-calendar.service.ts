/**
 * Google Calendar API Service
 * Fetches accurate holiday data from Google's public holiday calendars
 */

interface GoogleCalendarEvent {
  summary: string;
  start: { date: string };
  description?: string;
  location?: string;
}

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[];
}

interface Holiday {
  date: string;
  name: string;
  type: 'public_holiday' | 'festival';
  description?: string;
}

export class GoogleCalendarService {
  private readonly API_KEY: string;
  private readonly BASE_URL = 'https://www.googleapis.com/calendar/v3';
  
  // Indian public holidays calendar ID
  private readonly INDIAN_HOLIDAYS_CALENDAR = 'en.indian%23holiday%40group.v.calendar.google.com';

  constructor() {
    // Get API key from environment (server-side only)
    this.API_KEY = typeof process !== 'undefined' && process.env ? (process.env.GOOGLE_CALENDAR_API_KEY || '') : '';
    
    if (!this.API_KEY && typeof window === 'undefined') {
      console.warn('[Google Calendar] API key not configured');
    }
  }

  /**
   * Fetch all holidays for a specific year
   */
  async fetchYearHolidays(year: number): Promise<Holiday[]> {
    if (!this.API_KEY) {
      console.warn('[Google Calendar] API key not configured, using fallback data');
      return this.getFallbackHolidays(year);
    }

    try {
      const timeMin = `${year}-01-01T00:00:00Z`;
      const timeMax = `${year}-12-31T23:59:59Z`;
      
      const url = `${this.BASE_URL}/calendars/${this.INDIAN_HOLIDAYS_CALENDAR}/events?` +
        `timeMin=${timeMin}&timeMax=${timeMax}&key=${this.API_KEY}&singleEvents=true&orderBy=startTime`;

      console.log(`[Google Calendar] Fetching holidays for ${year}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[Google Calendar] API error: ${response.status} ${response.statusText}`);
        return this.getFallbackHolidays(year);
      }

      const data: GoogleCalendarResponse = await response.json();
      
      const holidays = data.items.map(event => ({
        date: event.start.date,
        name: event.summary,
        type: this.categorizeHoliday(event.summary),
        description: event.description || event.summary
      }));

      console.log(`[Google Calendar] Fetched ${holidays.length} holidays for ${year}`);
      return holidays;
      
    } catch (error) {
      console.error('[Google Calendar] Error fetching holidays:', error);
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
    
    const festivals = [
      'Holi', 'Diwali', 'Dussehra', 'Eid', 'Baisakhi', 'Karva Chauth',
      'Raksha Bandhan', 'Janmashtami', 'Navratri', 'Durga Puja'
    ];

    // Check if it's a public holiday
    if (publicHolidays.some(holiday => name.toLowerCase().includes(holiday.toLowerCase()))) {
      return 'public_holiday';
    }
    
    // Check if it's a festival
    if (festivals.some(festival => name.toLowerCase().includes(festival.toLowerCase()))) {
      return 'festival';
    }
    
    // Default to festival for religious/cultural events
    return 'festival';
  }

  /**
   * Fallback holidays when API is unavailable
   * These are the most accurate and commonly observed holidays in India
   */
  private getFallbackHolidays(year: number): Holiday[] {
    // Calculate dynamic holidays (these dates change every year)
    const holidays: Holiday[] = [
      // Fixed date holidays
      { date: `${year}-01-01`, name: 'New Year\'s Day', type: 'public_holiday' },
      { date: `${year}-01-26`, name: 'Republic Day', type: 'public_holiday' },
      { date: `${year}-08-15`, name: 'Independence Day', type: 'public_holiday' },
      { date: `${year}-10-02`, name: 'Gandhi Jayanti', type: 'public_holiday' },
      { date: `${year}-12-25`, name: 'Christmas Day', type: 'public_holiday' },
    ];

    // Add year-specific dynamic holidays (these would need to be updated)
    if (year === 2026) {
      holidays.push(
        { date: '2026-03-14', name: 'Holi', type: 'festival' },
        { date: '2026-04-14', name: 'Baisakhi', type: 'festival' },
        { date: '2026-04-18', name: 'Good Friday', type: 'public_holiday' },
        { date: '2026-05-12', name: 'Buddha Purnima', type: 'festival' },
        { date: '2026-08-24', name: 'Janmashtami', type: 'festival' },
        { date: '2026-09-17', name: 'Ganesh Chaturthi', type: 'festival' },
        { date: '2026-10-20', name: 'Dussehra', type: 'festival' },
        { date: '2026-11-08', name: 'Diwali', type: 'festival' },
        { date: '2026-11-19', name: 'Guru Nanak Jayanti', type: 'festival' }
      );
    } else if (year === 2027) {
      holidays.push(
        { date: '2027-03-04', name: 'Holi', type: 'festival' },
        { date: '2027-04-14', name: 'Baisakhi', type: 'festival' },
        { date: '2027-04-02', name: 'Good Friday', type: 'public_holiday' },
        { date: '2027-05-01', name: 'Buddha Purnima', type: 'festival' },
        { date: '2027-08-13', name: 'Janmashtami', type: 'festival' },
        { date: '2027-09-06', name: 'Ganesh Chaturthi', type: 'festival' },
        { date: '2027-10-09', name: 'Dussehra', type: 'festival' },
        { date: '2027-10-28', name: 'Diwali', type: 'festival' },
        { date: '2027-11-08', name: 'Guru Nanak Jayanti', type: 'festival' }
      );
    }

    console.log(`[Google Calendar] Using fallback holidays for ${year}: ${holidays.length} holidays`);
    return holidays;
  }

  /**
   * Check if holidays exist for a specific year
   */
  async checkHolidaysExist(year: number): Promise<boolean> {
    try {
      // This would check your database
      // Implementation depends on your database setup
      return false; // For now, always fetch fresh data
    } catch (error) {
      console.error('[Google Calendar] Error checking existing holidays:', error);
      return false;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();