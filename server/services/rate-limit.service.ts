/**
 * Rate Limiting Service
 * Serverless-compatible rate limiting using Supabase
 * Uses atomic Postgres function to prevent race conditions
 */

import { supabase } from '../supabase/client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  headers: Record<string, string>;
}

export interface RateLimitParams {
  identifier: string;
  endpoint: string;
  limit: number;
  windowMinutes: number;
}

export const rateLimitService = {
  /**
   * Check if request is within rate limit
   * Uses atomic Postgres function to prevent race conditions
   * 
   * @param params - Rate limit parameters
   * @returns Rate limit result with allowed status and headers
   */
  async check(params: RateLimitParams): Promise<RateLimitResult> {
    try {
      // Call atomic Postgres function
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: params.identifier,
        p_endpoint: params.endpoint,
        p_limit: params.limit,
        p_window_minutes: params.windowMinutes,
      });

      if (error) {
        console.error('❌ [RATE LIMIT] Database error:', error);
        // Fail open: Allow request on error to avoid blocking legitimate users
        return this.failOpen(params);
      }

      if (!data || data.length === 0) {
        console.error('❌ [RATE LIMIT] No data returned from function');
        return this.failOpen(params);
      }

      const result = data[0];
      const resetAt = new Date(result.reset_at);

      console.log(`🔒 [RATE LIMIT] ${params.endpoint}:`, {
        identifier: params.identifier,
        allowed: result.allowed,
        remaining: result.remaining,
        resetAt: resetAt.toISOString(),
      });

      return {
        allowed: result.allowed,
        remaining: result.remaining,
        resetAt: resetAt,
        headers: this.generateHeaders(params.limit, result.remaining, resetAt),
      };
    } catch (err) {
      console.error('❌ [RATE LIMIT] Exception:', err);
      // Fail open on exception
      return this.failOpen(params);
    }
  },

  /**
   * Fail-open strategy: Allow request on error
   * Prevents legitimate users from being blocked due to system issues
   * 
   * @param params - Rate limit parameters
   * @returns Permissive rate limit result
   */
  failOpen(params: RateLimitParams): RateLimitResult {
    const resetAt = new Date(Date.now() + params.windowMinutes * 60 * 1000);
    return {
      allowed: true,
      remaining: params.limit,
      resetAt: resetAt,
      headers: this.generateHeaders(params.limit, params.limit, resetAt),
    };
  },

  /**
   * Generate standard rate limit headers
   * Compatible with industry standards (GitHub, Twitter, etc.)
   * 
   * @param limit - Maximum requests allowed
   * @param remaining - Remaining requests in window
   * @param resetAt - When the rate limit window resets
   * @returns Headers object
   */
  generateHeaders(limit: number, remaining: number, resetAt: Date): Record<string, string> {
    return {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.floor(resetAt.getTime() / 1000).toString(),
    };
  },

  /**
   * Check login rate limit
   * Strict: 5 attempts per 10 minutes per IP+email combination
   * 
   * @param ip - Client IP address
   * @param email - Login email
   * @returns Rate limit result
   */
  async checkLogin(ip: string, email: string): Promise<RateLimitResult> {
    return this.check({
      identifier: `${ip}-${email}`,
      endpoint: 'login',
      limit: 5,
      windowMinutes: 10,
    });
  },

  /**
   * Check attendance rate limit
   * Moderate: 5 requests per minute per user
   * 
   * @param userId - User ID
   * @returns Rate limit result
   */
  async checkAttendance(userId: string): Promise<RateLimitResult> {
    return this.check({
      identifier: userId,
      endpoint: 'attendance',
      limit: 5,
      windowMinutes: 1,
    });
  },

  /**
   * Check general API rate limit
   * Lenient: 100 requests per 15 minutes per IP
   * 
   * @param ip - Client IP address
   * @returns Rate limit result
   */
  async checkGeneral(ip: string): Promise<RateLimitResult> {
    return this.check({
      identifier: ip,
      endpoint: 'general',
      limit: 100,
      windowMinutes: 15,
    });
  },
};
