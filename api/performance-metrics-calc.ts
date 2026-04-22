/**
 * Performance Metrics Calculation API
 * Handles performance metrics calculation requests from frontend
 * Uses backend environment variables (service role key)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../server/types/database';
import { performanceAnalyticsService } from '../server/services/performance-analytics.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Performance Calc API] Missing Supabase credentials');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Supabase credentials not configured'
      });
    }

    // Get authorization token from request header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized - missing auth token' });
    }

    // Token exists - we'll use service role to bypass RLS
    console.log('[Performance Calc API] Authorization header present, proceeding...');

    // Create service role client
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[Performance Calc API] Starting metrics calculation...');

    const result = await performanceAnalyticsService.calculateAllEmployeesMetrics();
    
    console.log('[Performance Calc API] Calculation result:', result);

    return res.status(200).json(result);

  } catch (error) {
    console.error('[Performance Calc API] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to calculate metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
