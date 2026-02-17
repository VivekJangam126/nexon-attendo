/**
 * API Endpoint: Send Report Email
 * Handles requests to send attendance reports via email
 * PDF is generated on frontend and sent as base64
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { emailReportService } from '../services/email-report.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Supabase client with environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is authenticated and is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Parse request body
    const { timeRange, customDateFrom, customDateTo, pdfBase64, reportData } = req.body;

    if (!timeRange || !pdfBase64 || !reportData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get HR email settings
    const { data: emailSettings } = await supabase
      .from('email_report_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    const hrEmail = emailSettings?.hr_email || process.env.DEFAULT_HR_EMAIL;
    const ccEmails = emailSettings?.cc_emails || [];
    const includeSummary = emailSettings?.include_summary ?? true;

    if (!hrEmail) {
      return res.status(400).json({ error: 'No recipient email configured' });
    }

    // Convert base64 to Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const pdfSizeKB = Math.round(pdfBuffer.length / 1024);

    // Send email
    const emailResult = await emailReportService.sendReport({
      to: hrEmail,
      cc: ccEmails,
      subject: `Attendance Report - ${reportData.reportType} (${reportData.dateRange})`,
      pdfBuffer,
      pdfFilename: `attendance-report-${timeRange}-${Date.now()}.pdf`,
      reportData: reportData,
      includeSummary,
    });

    // Calculate date range for logging
    const today = new Date();
    let startDate: string;
    let endDate: string;

    if (timeRange === 'custom' && customDateFrom && customDateTo) {
      startDate = customDateFrom;
      endDate = customDateTo;
    } else if (timeRange === 'today') {
      startDate = today.toISOString().split('T')[0];
      endDate = startDate;
    } else if (timeRange === 'week') {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      startDate = weekStart.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
    } else {
      const monthStart = new Date(today);
      monthStart.setDate(monthStart.getDate() - 29);
      startDate = monthStart.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
    }

    // Log email send attempt
    const logData = {
      sent_by: user.id,
      sent_to: hrEmail,
      cc_emails: ccEmails,
      report_type: timeRange,
      date_range_start: startDate,
      date_range_end: endDate,
      status: emailResult.success ? 'sent' : 'failed',
      error_message: emailResult.error || null,
      pdf_size_kb: pdfSizeKB,
    };

    await supabase.from('email_report_logs').insert(logData);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send email',
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: `Report sent successfully to ${hrEmail}`,
      sentAt: new Date().toISOString(),
      messageId: emailResult.messageId,
      pdfSizeKB,
    });

  } catch (error) {
    console.error('Error sending report email:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
