import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://falbkccaqjqdbvrmdlll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Employees API endpoint
 * GET /api/employees - Get all employees (admin) or current employee (employee)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[Employees API] Request received:', {
      method: req.method,
      url: req.url,
      query: req.query
    });

    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (req.method === 'GET') {
      return await getEmployees(req, res, profile);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('[Employees API] Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      stack: error.stack
    });
  }
}

/**
 * GET /api/employees
 * Get all employees (admin) or current employee info (employee)
 */
async function getEmployees(req: VercelRequest, res: VercelResponse, profile: any) {
  try {
    console.log('[Employees API] Getting employees for user:', profile.role_type);

    if (profile.role_type === 'Admin' || profile.role_type === 'Super Admin') {
      // Admin: Get all employees
      const { data: employees, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role_type,
          designation,
          status,
          created_at,
          updated_at
        `)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('[Employees API] Error fetching employees:', error);
        return res.status(500).json({ error: error.message });
      }

      console.log('[Employees API] Found', employees?.length || 0, 'employees');
      return res.status(200).json({
        employees: employees || []
      });
    } else {
      // Employee: Get only their own info
      return res.status(200).json({
        employees: [profile]
      });
    }

  } catch (error: any) {
    console.error('[Employees API] Exception in getEmployees:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get employees',
      stack: error.stack
    });
  }
}