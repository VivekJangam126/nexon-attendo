/**
 * Date Formatting Utilities
 * Handles IST timezone and date formatting
 */

import { format, parseISO, parse } from 'date-fns';

/**
 * Get current IST date in YYYY-MM-DD format
 */
export const getTodayDateIST = (): string => {
  try {
    // Get current UTC time
    const now = new Date();
    
    // Convert to IST by adding 5.5 hours (19800000 milliseconds)
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    
    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error getting today\'s date:', error);
    // Fallback to simple date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/**
 * Format ISO timestamp to IST time (e.g., "09:30 AM")
 */
export const formatTimeIST = (isoString: string): string => {
  try {
    const date = parseISO(isoString);
    // Convert to IST by adding 5.5 hours
    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    return format(istDate, 'hh:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return '--:--';
  }
};

/**
 * Format date string to readable format (e.g., "Mon, Jan 15")
 */
export const formatDate = (dateString: string): string => {
  try {
    // Handle both ISO and YYYY-MM-DD formats
    const date = dateString.includes('T') 
      ? parseISO(dateString)
      : parse(dateString, 'yyyy-MM-dd', new Date());
    return format(date, 'EEE, MMM dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Format date string to full format (e.g., "Monday, January 15, 2024")
 */
export const formatDateFull = (dateString: string): string => {
  try {
    // Handle both ISO and YYYY-MM-DD formats
    const date = dateString.includes('T') 
      ? parseISO(dateString)
      : parse(dateString, 'yyyy-MM-dd', new Date());
    return format(date, 'EEEE, MMMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Check if date is today
 */
export const isToday = (dateString: string): boolean => {
  return dateString === getTodayDateIST();
};
