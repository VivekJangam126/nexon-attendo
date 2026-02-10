/**
 * Attendance Configuration
 * Fixed time windows and validation rules
 */

export const ATTENDANCE_CONFIG = {
  /**
   * Attendance Time Window (IST)
   * Users can mark attendance only within this window
   */
  TIME_WINDOW: {
    START_HOUR: 9,    // 09:30 IST
    START_MINUTE: 30,
    END_HOUR: 11,     // 11:30 IST
    END_MINUTE: 30,
  },

  /**
   * Timezone
   * All server times are in IST (Indian Standard Time)
   */
  TIMEZONE: 'Asia/Kolkata',

  /**
   * Attendance Status Rules
   * - If check-in <= window end → present
   * - Late logic can be expanded later
   */
  STATUS_RULES: {
    ON_TIME: 'present' as const,
    LATE: 'late' as const,
    ABSENT: 'absent' as const,
  },

  /**
   * Validation Rules
   * Order of validation checks
   */
  VALIDATION_ORDER: [
    'USER_AUTHENTICATED',
    'USER_IS_EMPLOYEE',
    'USER_IS_ACTIVE',
    'USER_HAS_OFFICE',
    'WITHIN_TIME_WINDOW',
    'NO_DUPLICATE_ATTENDANCE',
  ] as const,
};

/**
 * Get current time in IST
 */
export function getCurrentISTTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ATTENDANCE_CONFIG.TIMEZONE }));
}

/**
 * Get today's date in YYYY-MM-DD format (IST)
 */
export function getTodayDateIST(): string {
  const now = getCurrentISTTime();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if current time is within attendance window
 */
export function isWithinAttendanceWindow(): boolean {
  const now = getCurrentISTTime();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const { START_HOUR, START_MINUTE, END_HOUR, END_MINUTE } = ATTENDANCE_CONFIG.TIME_WINDOW;

  // Convert to minutes for easier comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const startTimeInMinutes = START_HOUR * 60 + START_MINUTE;
  const endTimeInMinutes = END_HOUR * 60 + END_MINUTE;

  return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
}

/**
 * Get attendance window display string
 */
export function getAttendanceWindowString(): string {
  const { START_HOUR, START_MINUTE, END_HOUR, END_MINUTE } = ATTENDANCE_CONFIG.TIME_WINDOW;
  
  const formatTime = (hour: number, minute: number) => {
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    return `${h}:${m}`;
  };

  return `${formatTime(START_HOUR, START_MINUTE)} - ${formatTime(END_HOUR, END_MINUTE)} IST`;
}
