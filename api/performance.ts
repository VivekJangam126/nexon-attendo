/**
 * Performance API Endpoint
 * Handles performance data requests from frontend
 * Uses backend environment variables (service role key)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../server/types/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[Performance API] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Performance API] Missing Supabase credentials');
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
    console.log('[Performance API] Authorization header present, proceeding...');

    // Create service role client for admin queries
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get all employees with their performance data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    console.log('[Performance API] Fetching employee performance data...');

    // Fetch all employees with role=employee
    const empResp = await supabase
      .from('profiles')
      .select('id, full_name, designation, role_type, status, role')
      .eq('role', 'employee');

    const employees = (empResp as any).data || [];
    const empError = (empResp as any).error;

    if (empError) {
      console.error('[Performance API] Error fetching employees:', empError);
      throw empError;
    }

    console.log('[Performance API] Found employees:', employees.length);

    if (employees.length === 0) {
      return res.status(200).json({ 
        success: true, 
        employees: [] 
      });
    }

    const employeeIds = employees.map((emp: any) => emp.id);

    // Get all metrics for current month
    const metricsResp = await supabase
      .from('performance_metrics')
      .select('*')
      .in('employee_id', employeeIds)
      .eq('month', currentMonth)
      .eq('year', currentYear);

    const allMetrics = (metricsResp as any).data || [];
    const metricsError = (metricsResp as any).error;

    if (metricsError) {
      console.error('[Performance API] Error fetching metrics:', metricsError);
      throw metricsError;
    }

    // Get active alerts for all employees
    const alertsResp = await supabase
      .from('performance_alerts')
      .select('*')
      .in('employee_id', employeeIds)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const allAlerts = (alertsResp as any).data || [];
    const alertsError = (alertsResp as any).error;

    if (alertsError) {
      console.error('[Performance API] Error fetching alerts:', alertsError);
      throw alertsError;
    }

    // Create lookup maps
    const metricsMap = new Map();
    const alertsMap = new Map();

    allMetrics.forEach((metric: any) => {
      metricsMap.set(metric.employee_id, metric);
    });

    allAlerts.forEach((alert: any) => {
      if (!alertsMap.has(alert.employee_id)) {
        alertsMap.set(alert.employee_id, []);
      }
      alertsMap.get(alert.employee_id).push(alert);
    });

    // Build employee cards
    const employeeCards = employees.map((emp: any) => ({
      employee_id: emp.id,
      employee_name: emp.full_name,
      designation: emp.designation || 'Employee',
      role_type: emp.role_type || 'Employee',
      status: emp.status,
      current_month_metrics: metricsMap.get(emp.id) || null,
      active_alerts: alertsMap.get(emp.id) || [],
      alert_count: (alertsMap.get(emp.id) || []).length
    }));

    console.log('[Performance API] Successfully fetched performance data for', employeeCards.length, 'employees');

    return res.status(200).json({ 
      success: true, 
      employees: employeeCards 
    });

  } catch (error) {
    console.error('[Performance API] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch performance data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
