/**
 * Device Fingerprinting Utility
 * Generates unique device identifier for tracking purposes
 * 
 * IMPORTANT: This is for LOGGING ONLY, not security enforcement
 * Device fingerprints can be spoofed and should not be used for access control
 */

interface DeviceFingerprintData {
  userAgent: string;
  language: string;
  platform: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  randomId: string;
}

/**
 * Generate or retrieve device fingerprint
 * Stores in localStorage for persistence across sessions
 * 
 * @returns Device ID string (base64 encoded fingerprint)
 */
/**
 * Safe UUID generator — uses crypto.randomUUID() where available,
 * falls back to a Math.random-based UUID for older browsers (Safari < 15.4, Samsung Internet < 16)
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceFingerprint(): string {
  try {
    const existingDeviceId = localStorage.getItem('device_id');
    if (existingDeviceId) {
      return existingDeviceId;
    }
    const fingerprint = generateFingerprint();
    const deviceId = btoa(JSON.stringify(fingerprint));
    localStorage.setItem('device_id', deviceId);
    return deviceId;
  } catch (error) {
    const fallbackId = generateUUID();
    try { localStorage.setItem('device_id', fallbackId); } catch {}
    return fallbackId;
  }
}

/**
 * Generate device fingerprint from browser properties
 * Combines multiple browser characteristics for uniqueness
 * 
 * @returns Fingerprint data object
 */
function generateFingerprint(): DeviceFingerprintData {
  const nav = navigator;
  const screen = window.screen;

  return {
    userAgent: nav.userAgent,
    language: nav.language,
    platform: nav.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    randomId: generateUUID(),
  };
}

/**
 * Get user agent string
 * Useful for separate tracking alongside device ID
 * 
 * @returns User agent string
 */
export function getUserAgent(): string {
  return navigator.userAgent;
}

/**
 * Clear device fingerprint from localStorage
 * Useful for testing or privacy features
 */
export function clearDeviceFingerprint(): void {
  localStorage.removeItem('device_id');
  console.log('📱 [DEVICE] Cleared device fingerprint');
}

/**
 * Get device info for display purposes
 * Extracts readable information from user agent
 * 
 * @returns Device info object
 */
export function getDeviceInfo(): {
  browser: string;
  os: string;
  device: string;
} {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  }

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  }

  // Detect device type
  let device = 'Desktop';
  if (ua.includes('Mobile')) {
    device = 'Mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    device = 'Tablet';
  }

  return { browser, os, device };
}
