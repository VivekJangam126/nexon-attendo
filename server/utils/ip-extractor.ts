/**
 * IP Address Extraction Utility
 * Extracts real client IP from Vercel/proxy headers
 * Handles x-forwarded-for chains and proxy scenarios
 */

/**
 * Extract real client IP address from request headers
 * Handles proxy chains and Vercel serverless environment
 * 
 * Priority order:
 * 1. x-forwarded-for (first IP in chain = client IP)
 * 2. x-real-ip (direct proxy header)
 * 3. Fallback to 'unknown' if no headers present
 * 
 * @param headers - Request headers object
 * @returns Client IP address or 'unknown'
 */
export function extractClientIP(headers: Record<string, string | string[] | undefined>): string {
  // Check x-forwarded-for header (most common in proxy chains)
  const forwardedFor = headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can be: "client, proxy1, proxy2"
    // We want the first IP (client IP)
    const forwardedForStr = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const firstIP = forwardedForStr.split(',')[0].trim();
    if (firstIP) {
      return firstIP;
    }
  }

  // Check x-real-ip header (alternative proxy header)
  const realIP = headers['x-real-ip'];
  if (realIP) {
    const realIPStr = Array.isArray(realIP) ? realIP[0] : realIP;
    return realIPStr.trim();
  }

  // Fallback: No proxy headers found
  return 'unknown';
}

/**
 * Validate if IP address is in valid format
 * Supports IPv4 and IPv6
 * 
 * @param ip - IP address string
 * @returns true if valid IP format
 */
export function isValidIP(ip: string): boolean {
  if (!ip || ip === 'unknown') {
    return false;
  }

  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Sanitize IP address for storage
 * Removes invalid characters and normalizes format
 * 
 * @param ip - Raw IP address
 * @returns Sanitized IP address
 */
export function sanitizeIP(ip: string): string {
  if (!ip) {
    return 'unknown';
  }

  // Remove whitespace
  const trimmed = ip.trim();

  // Validate format
  if (!isValidIP(trimmed)) {
    return 'unknown';
  }

  return trimmed;
}
