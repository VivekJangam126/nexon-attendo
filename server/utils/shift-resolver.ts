/**
 * Shift Resolver Utility
 * Determines the actual shift for an employee based on shift_mode and shift_config
 * Supports: fixed, rotating, and custom shifts
 */

export interface ResolvedShift {
  name: string;
  start: string;      // HH:MM format
  end: string;        // HH:MM format
  type: 'fixed' | 'rotating' | 'custom';
  rotationInfo?: string;  // For rotating: "Week X" info
}

export interface ShiftConfig {
  type: 'fixed' | 'rotating' | 'custom';
  value?: string;      // For fixed: "morning" | "evening"
  startDate?: string;  // For rotating: ISO date
  pattern?: string[];  // For rotating: ["morning", "evening"]
  startTime?: string;  // For custom: HH:MM
  endTime?: string;    // For custom: HH:MM
}

// Fixed shift definitions
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
 * Get the current week number since a start date
 */
function getWeeksSince(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, diffWeeks);
}

/**
 * Resolve fixed shift
 */
function resolveFixedShift(shiftType?: string): ResolvedShift {
  const shift = shiftType && FIXED_SHIFTS[shiftType] ? FIXED_SHIFTS[shiftType] : FIXED_SHIFTS.evening;
  return {
    name: shift.name + ' Shift',
    start: shift.start,
    end: shift.end,
    type: 'fixed',
  };
}

/**
 * Resolve rotating shift
 */
function resolveRotatingShift(config: ShiftConfig): ResolvedShift {
  if (!config.startDate || !config.pattern || config.pattern.length === 0) {
    console.warn('Invalid rotating shift config, falling back to evening');
    return resolveFixedShift('evening');
  }

  const weeksSince = getWeeksSince(config.startDate);
  const rotationIndex = weeksSince % config.pattern.length;
  const currentShiftType = config.pattern[rotationIndex];

  const shift = FIXED_SHIFTS[currentShiftType] || FIXED_SHIFTS.evening;

  return {
    name: `This Week: ${shift.name} Shift`,
    start: shift.start,
    end: shift.end,
    type: 'rotating',
    rotationInfo: `Week ${weeksSince + 1}, Pattern: ${config.pattern.join(' → ')}`,
  };
}

/**
 * Resolve custom shift
 */
function resolveCustomShift(config: ShiftConfig): ResolvedShift {
  if (!config.startTime || !config.endTime) {
    console.warn('Invalid custom shift config, falling back to evening');
    return resolveFixedShift('evening');
  }

  return {
    name: 'Custom Shift',
    start: config.startTime,
    end: config.endTime,
    type: 'custom',
  };
}

/**
 * Main resolver function
 * Determines the actual shift for an employee
 * 
 * @param user - User profile with shift_mode and shift_config
 * @returns ResolvedShift with current applicable shift timings
 */
export function resolveEmployeeShift(user: any): ResolvedShift {
  // Default: use existing shift_type (backward compatibility)
  if (!user.shift_mode || user.shift_mode === 'fixed') {
    return resolveFixedShift(user.shift_type);
  }

  const config = user.shift_config as ShiftConfig | undefined;

  if (!config) {
    console.warn(`No shift_config for user ${user.id}, falling back to evening`);
    return resolveFixedShift('evening');
  }

  switch (user.shift_mode) {
    case 'rotating':
      return resolveRotatingShift(config);

    case 'custom':
      return resolveCustomShift(config);

    case 'fixed':
    default:
      return resolveFixedShift(user.shift_type);
  }
}

/**
 * Format shift for display
 */
export function formatShiftDisplay(shift: ResolvedShift): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minutes} ${period}`;
  };

  return `${shift.name} (${formatTime(shift.start)} – ${formatTime(shift.end)})`;
}

/**
 * Get shift end time with buffer for auto-checkout
 */
export function getAutoCheckoutTime(shift: ResolvedShift, bufferMinutes: number = 30): string {
  const [hours, minutes] = shift.end.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + bufferMinutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;

  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}
