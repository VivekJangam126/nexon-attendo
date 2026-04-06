/**
 * Shift Formatter Utility
 * Formats shift information for display on the dashboard
 */

interface ShiftData {
  shift_type?: string;
  shift_mode?: string;
  shift_config?: Record<string, any>;
}

const FIXED_SHIFTS: Record<string, { name: string; start: string; end: string }> = {
  morning: {
    name: 'Morning',
    start: '06:00',
    end: '15:00',
  },
  evening: {
    name: 'Evening',
    start: '10:00',
    end: '19:00',
  },
};

/**
 * Format time from HH:MM to 12-hour format with AM/PM (full: "6:00 AM")
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${minutes} ${period}`;
}

/**
 * Format time from HH:MM to 12-hour format with am/pm (compact: "6am")
 */
function formatTimeCompact(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const period = h >= 12 ? 'pm' : 'am';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${minutes}${period}`;
}

/**
 * Get the number of weeks since a start date
 */
function getWeeksSince(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, diffWeeks);
}

/**
 * Format shift display message for all shift types
 * Returns: "Type: Shift Details (Time Range)"
 */
export function getShiftDisplayMessage(profile: ShiftData): string {
  const mode = profile.shift_mode || 'fixed';

  // FIXED SHIFT
  if (mode === 'fixed') {
    const shiftType = profile.shift_type || 'evening';
    const shift = FIXED_SHIFTS[shiftType] || FIXED_SHIFTS.evening;
    const startTime = formatTime(shift.start);
    const endTime = formatTime(shift.end);
    return `Your ${shift.name} Shift is from ${startTime} to ${endTime}`;
  }

  // ROTATING SHIFT
  if (mode === 'rotating') {
    const config = profile.shift_config as any;
    if (config?.startDate && config?.pattern && config.pattern.length > 0) {
      const weeksSince = getWeeksSince(config.startDate);
      const rotationIndex = weeksSince % config.pattern.length;
      const currentShiftType = config.pattern[rotationIndex];

      const shift = FIXED_SHIFTS[currentShiftType] || FIXED_SHIFTS.evening;
      const startTime = formatTime(shift.start);
      const endTime = formatTime(shift.end);

      return `Your Rotating Shift (Week ${weeksSince + 1}) is from ${startTime} to ${endTime}`;
    }
    return 'Your Rotating Shift is not properly configured';
  }

  // CUSTOM SHIFT
  if (mode === 'custom') {
    const config = profile.shift_config as any;
    if (config?.startTime && config?.endTime) {
      const startTime = formatTime(config.startTime);
      const endTime = formatTime(config.endTime);
      return `Your Custom Shift is from ${startTime} to ${endTime}`;
    }
    return 'Your Custom Shift is not properly configured';
  }

  return 'No shift assigned';
}

/**
 * Get shift badge color based on shift type or mode
 */
export function getShiftBadgeColor(profile: ShiftData): string {
  const mode = profile.shift_mode || 'fixed';

  if (mode === 'fixed') {
    const shiftType = profile.shift_type || 'evening';
    return shiftType === 'morning'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700';
  }

  if (mode === 'rotating') {
    return 'bg-amber-100 text-amber-700';
  }

  if (mode === 'custom') {
    return 'bg-green-100 text-green-700';
  }

  return 'bg-gray-100 text-gray-700';
}

/**
 * Get SHORT shift display for admin panels (compact format)
 * Returns: "Shift Type - Time Range"
 * Examples: "Morning - 6:00am to 3:00pm", "Rotating (W1) - 10:00am to 7:00pm"
 */
export function getShiftDisplayShort(profile: ShiftData): string {
  const mode = profile.shift_mode || 'fixed';

  // FIXED SHIFT
  if (mode === 'fixed') {
    const shiftType = profile.shift_type || 'evening';
    const shift = FIXED_SHIFTS[shiftType] || FIXED_SHIFTS.evening;
    const startTime = formatTimeCompact(shift.start);
    const endTime = formatTimeCompact(shift.end);
    return `${shift.name} - ${startTime} to ${endTime}`;
  }

  // ROTATING SHIFT
  if (mode === 'rotating') {
    const config = profile.shift_config as any;
    if (config?.startDate && config?.pattern && config.pattern.length > 0) {
      const weeksSince = getWeeksSince(config.startDate);
      const rotationIndex = weeksSince % config.pattern.length;
      const currentShiftType = config.pattern[rotationIndex];

      const shift = FIXED_SHIFTS[currentShiftType] || FIXED_SHIFTS.evening;
      const startTime = formatTimeCompact(shift.start);
      const endTime = formatTimeCompact(shift.end);

      return `Rotating (W${weeksSince + 1}) - ${startTime} to ${endTime}`;
    }
    return 'Rotating - Not configured';
  }

  // CUSTOM SHIFT
  if (mode === 'custom') {
    const config = profile.shift_config as any;
    if (config?.startTime && config?.endTime) {
      const startTime = formatTimeCompact(config.startTime);
      const endTime = formatTimeCompact(config.endTime);
      return `Custom - ${startTime} to ${endTime}`;
    }
    return 'Custom - Not configured';
  }

  return 'Not assigned';
}

/**
 * Get badge color for short display (admin panel)
 * Returns Tailwind classes for color coding
 */
export function getShiftBadgeColorShort(profile: ShiftData): string {
  const mode = profile.shift_mode || 'fixed';

  if (mode === 'fixed') {
    const shiftType = profile.shift_type || 'evening';
    return shiftType === 'morning'
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'bg-purple-50 border-purple-300 text-purple-700';
  }

  if (mode === 'rotating') {
    return 'bg-amber-50 border-amber-300 text-amber-700';
  }

  if (mode === 'custom') {
    return 'bg-green-50 border-green-300 text-green-700';
  }

  return 'bg-gray-50 border-gray-300 text-gray-700';
}

/**
 * Check if profile has a shift assigned
 */
export function hasShiftAssigned(profile: ShiftData): boolean {
  return !!(profile.shift_type || profile.shift_mode);
}
