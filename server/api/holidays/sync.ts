/**
 * Holiday Sync API Endpoint
 * Fetches accurate holidays from Google Calendar API
 */

import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Regular client for auth
import { supabase } from '../../supabase/client';

// Create service role client for admin operations (bypasses RLS)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

console.log('[Holiday Sync] Supabase URL:', supabaseUrl);
console.log('[Holiday Sync] Service key length:', supabaseServiceKey.length);
console.log('[Holiday Sync] Service key first 20 chars:', supabaseServiceKey.substring(0, 20));

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface GoogleCalendarEvent {
  summary: string;
  start: { date: string };
  description?: string;
}

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[];
}

/**
 * Fetch holidays from Google Calendar API for a specific year
 */
async function fetchGoogleCalendarHolidays(year: number) {
  const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
  
  if (!API_KEY) {
    console.error('[Holiday Sync] Google Calendar API key not configured');
    return [];
  }

  try {
    const INDIAN_HOLIDAYS_CALENDAR = 'en.indian%23holiday%40group.v.calendar.google.com';
    const timeMin = `${year}-01-01T00:00:00Z`;
    const timeMax = `${year}-12-31T23:59:59Z`;
    
    const url = `https://www.googleapis.com/calendar/v3/calendars/${INDIAN_HOLIDAYS_CALENDAR}/events?` +
      `timeMin=${timeMin}&timeMax=${timeMax}&key=${API_KEY}&singleEvents=true&orderBy=startTime`;

    console.log(`[Holiday Sync] Fetching holidays from Google Calendar for ${year}...`);
    console.log(`[Holiday Sync] API URL: ${url.replace(API_KEY, 'HIDDEN')}`);
    
    const response = await fetch(url);
    
    console.log(`[Holiday Sync] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Holiday Sync] Google API error: ${response.status} ${response.statusText}`);
      console.error(`[Holiday Sync] Error details:`, errorText);
      return [];
    }

    const data: GoogleCalendarResponse = await response.json();
    
    console.log(`[Holiday Sync] Raw response items count:`, data.items?.length || 0);
    
    if (!data.items || data.items.length === 0) {
      console.warn(`[Holiday Sync] No holidays found for ${year}`);
      return [];
    }

    const holidays = data.items.map(event => ({
      holiday_date: event.start.date,
      holiday_name: event.summary,
      holiday_type: categorizeHoliday(event.summary),
      description: event.description || event.summary,
      is_active: true
    }));

    console.log(`[Holiday Sync] Successfully processed ${holidays.length} holidays for ${year}`);
    console.log(`[Holiday Sync] First 3 holidays:`, holidays.slice(0, 3));
    
    return holidays;
    
  } catch (error) {
    console.error('[Holiday Sync] Exception while fetching from Google Calendar:', error);
    if (error instanceof Error) {
      console.error('[Holiday Sync] Error message:', error.message);
      console.error('[Holiday Sync] Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Categorize holiday type based on name
 */
function categorizeHoliday(name: string): 'national' | 'festival' | 'state' | 'optional' {
  const nationalHolidays = [
    'Republic Day', 'Independence Day', 'Gandhi Jayanti', 'Ambedkar Jayanti'
  ];
  
  const stateHolidays = [
    'Maharashtra Day', 'Shivaji Jayanti'
  ];
  
  // Check if it's a national holiday
  if (nationalHolidays.some(holiday => name.toLowerCase().includes(holiday.toLowerCase()))) {
    return 'national';
  }
  
  // Check if it's a state holiday
  if (stateHolidays.some(holiday => name.toLowerCase().includes(holiday.toLowerCase()))) {
    return 'state';
  }
  
  // Default to festival for religious/cultural events
  return 'festival';
}

export default async function handler(req: Request, res: Response) {
  const { method } = req;

  try {
    // Verify user is authenticated and is admin
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // GET /api/holidays/sync - Get sync status
    if (method === 'GET') {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;

      try {
        // Get current year holiday count using admin client
        const { count: currentCount, error: currentError } = await supabaseAdmin
          .from('master_public_holidays')
          .select('*', { count: 'exact', head: true })
          .gte('holiday_date', `${currentYear}-01-01`)
          .lte('holiday_date', `${currentYear}-12-31`);

        // Get next year holiday count using admin client
        const { count: nextCount, error: nextError } = await supabaseAdmin
          .from('master_public_holidays')
          .select('*', { count: 'exact', head: true })
          .gte('holiday_date', `${nextYear}-01-01`)
          .lte('holiday_date', `${nextYear}-12-31`);

        if (currentError || nextError) {
          console.error('[Holiday Sync API] Error getting counts:', currentError || nextError);
        }

        const status = {
          currentYear: {
            year: currentYear,
            count: currentCount || 0
          },
          nextYear: {
            year: nextYear,
            count: nextCount || 0
          }
        };
        
        return res.status(200).json({
          success: true,
          status,
          message: 'Holiday sync status retrieved'
        });
      } catch (error) {
        console.error('[Holiday Sync API] Error in GET:', error);
        return res.status(500).json({ error: 'Failed to get sync status' });
      }
    }

    // POST /api/holidays/sync - Trigger manual sync
    if (method === 'POST') {
      try {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        
        console.log(`[Holiday Sync API] Starting sync for ${currentYear} and ${nextYear}...`);
        
        let currentYearSynced = 0;
        let nextYearSynced = 0;
        
        // Sync current year
        const { count: currentCount } = await supabaseAdmin
          .from('master_public_holidays')
          .select('*', { count: 'exact', head: true })
          .gte('holiday_date', `${currentYear}-01-01`)
          .lte('holiday_date', `${currentYear}-12-31`);

        if (!currentCount || currentCount === 0) {
          console.log(`[Holiday Sync API] Fetching holidays for ${currentYear}...`);
          const currentYearHolidays = await fetchGoogleCalendarHolidays(currentYear);
          
          if (currentYearHolidays.length > 0) {
            // Deduplicate by date - keep first occurrence of each date
            const uniqueHolidays = currentYearHolidays.reduce((acc, holiday) => {
              if (!acc.find(h => h.holiday_date === holiday.holiday_date)) {
                acc.push(holiday);
              }
              return acc;
            }, [] as typeof currentYearHolidays);
            
            console.log(`[Holiday Sync API] After deduplication: ${uniqueHolidays.length} unique holidays`);
            
            // Use upsert to handle duplicates - update if exists, insert if not
            const { error: insertError } = await supabaseAdmin
              .from('master_public_holidays')
              .upsert(uniqueHolidays, { 
                onConflict: 'holiday_date',
                ignoreDuplicates: false 
              });

            if (insertError) {
              console.error('[Holiday Sync API] Error inserting current year holidays:', insertError);
            } else {
              currentYearSynced = uniqueHolidays.length;
              console.log(`[Holiday Sync API] Synced ${currentYearSynced} holidays for ${currentYear}`);
            }
          }
        } else {
          console.log(`[Holiday Sync API] ${currentYear} already has ${currentCount} holidays`);
          currentYearSynced = currentCount;
        }
        
        // Sync next year
        const { count: nextCount } = await supabaseAdmin
          .from('master_public_holidays')
          .select('*', { count: 'exact', head: true })
          .gte('holiday_date', `${nextYear}-01-01`)
          .lte('holiday_date', `${nextYear}-12-31`);

        if (!nextCount || nextCount === 0) {
          console.log(`[Holiday Sync API] Fetching holidays for ${nextYear}...`);
          const nextYearHolidays = await fetchGoogleCalendarHolidays(nextYear);
          
          console.log(`[Holiday Sync API] Received ${nextYearHolidays.length} holidays for ${nextYear}`);
          
          if (nextYearHolidays.length > 0) {
            // Deduplicate by date - keep first occurrence of each date
            const uniqueHolidays = nextYearHolidays.reduce((acc, holiday) => {
              if (!acc.find(h => h.holiday_date === holiday.holiday_date)) {
                acc.push(holiday);
              }
              return acc;
            }, [] as typeof nextYearHolidays);
            
            console.log(`[Holiday Sync API] After deduplication: ${uniqueHolidays.length} unique holidays`);
            
            // Use upsert to handle duplicates - update if exists, insert if not
            const { error: insertError } = await supabaseAdmin
              .from('master_public_holidays')
              .upsert(uniqueHolidays, { 
                onConflict: 'holiday_date',
                ignoreDuplicates: false 
              });

            if (insertError) {
              console.error('[Holiday Sync API] Error inserting next year holidays:', insertError);
            } else {
              nextYearSynced = uniqueHolidays.length;
              console.log(`[Holiday Sync API] Synced ${nextYearSynced} holidays for ${nextYear}`);
            }
          } else {
            console.warn(`[Holiday Sync API] No holidays fetched for ${nextYear} - API may have failed`);
          }
        } else {
          console.log(`[Holiday Sync API] ${nextYear} already has ${nextCount} holidays`);
          nextYearSynced = nextCount;
        }

        return res.status(200).json({
          success: true,
          message: `Sync completed: ${currentYear} (${currentYearSynced} holidays), ${nextYear} (${nextYearSynced} holidays)`,
          status: {
            currentYear: { year: currentYear, count: currentYearSynced },
            nextYear: { year: nextYear, count: nextYearSynced }
          }
        });
      } catch (error) {
        console.error('[Holiday Sync API] Error in POST:', error);
        return res.status(500).json({ 
          error: 'Failed to sync holidays',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[Holiday Sync API] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}