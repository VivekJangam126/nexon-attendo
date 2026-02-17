/**
 * Email Report Service
 * Handles sending attendance reports via email using Resend
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailReportParams {
  to: string;
  cc?: string[];
  subject: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
  reportData: {
    reportType: string;
    dateRange: string;
    stats: {
      totalEmployees: number;
      present: number;
      late: number;
      absent: number;
      attendanceRate: number;
    };
  };
  includeSummary?: boolean;
}

export const emailReportService = {
  /**
   * Send attendance report via email with PDF attachment
   */
  async sendReport(params: EmailReportParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { to, cc, subject, pdfBuffer, pdfFilename, reportData, includeSummary = true } = params;

      // Build email HTML template
      const htmlBody = this.buildEmailTemplate(reportData, includeSummary);

      // Convert PDF buffer to base64
      const pdfBase64 = pdfBuffer.toString('base64');

      // Send email via Resend
      const response = await resend.emails.send({
        from: process.env.REPORT_FROM_EMAIL || 'reports@nexus.com',
        to: [to],
        cc: cc && cc.length > 0 ? cc : undefined,
        subject: subject,
        html: htmlBody,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBase64,
          },
        ],
      });

      if (response.error) {
        console.error('Resend API error:', response.error);
        return {
          success: false,
          error: response.error.message || 'Failed to send email',
        };
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Build professional HTML email template
   */
  buildEmailTemplate(reportData: EmailReportParams['reportData'], includeSummary: boolean): string {
    const { reportType, dateRange, stats } = reportData;
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                📊 Attendance Report
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                Nexus Attendo - Employee Attendance Management
              </p>
            </td>
          </tr>

          <!-- Report Info -->
          <tr>
            <td style="padding: 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Dear HR Manager,
                    </p>
                    <p style="margin: 15px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      Please find attached the <strong>${reportType}</strong> attendance report for the period <strong>${dateRange}</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              ${includeSummary ? `
              <!-- Summary Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-top: 20px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">
                      📈 Attendance Summary
                    </h2>
                    
                    <!-- Stats Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding: 10px 0;">
                          <div style="color: #666666; font-size: 13px; margin-bottom: 5px;">Total Employees</div>
                          <div style="color: #333333; font-size: 24px; font-weight: 600;">${stats.totalEmployees}</div>
                        </td>
                        <td width="50%" style="padding: 10px 0;">
                          <div style="color: #666666; font-size: 13px; margin-bottom: 5px;">Attendance Rate</div>
                          <div style="color: #667eea; font-size: 24px; font-weight: 600;">${stats.attendanceRate}%</div>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 15px;">
                          <table width="100%" cellpadding="8" cellspacing="0" style="border-top: 1px solid #e0e0e0; margin-top: 10px;">
                            <tr>
                              <td style="color: #666666; font-size: 14px;">Present</td>
                              <td align="right" style="color: #16a34a; font-size: 16px; font-weight: 600;">${stats.present}</td>
                            </tr>
                            <tr>
                              <td style="color: #666666; font-size: 14px;">Late</td>
                              <td align="right" style="color: #ca8a04; font-size: 16px; font-weight: 600;">${stats.late}</td>
                            </tr>
                            <tr>
                              <td style="color: #666666; font-size: 14px;">Absent</td>
                              <td align="right" style="color: #dc2626; font-size: 16px; font-weight: 600;">${stats.absent}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Attachment Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px; background-color: #e8f4f8; border-left: 4px solid #667eea; border-radius: 4px; padding: 15px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #333333; font-size: 14px;">
                      📎 <strong>Detailed Report Attached</strong>
                    </p>
                    <p style="margin: 8px 0 0 0; color: #666666; font-size: 13px;">
                      The complete attendance report with detailed employee records is attached as a PDF document.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 40px; border-top: 1px solid #e0e0e0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                      <strong>Nexus Attendo</strong><br>
                      Employee Attendance Management System<br>
                      Generated on ${currentDate} at ${currentTime}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 15px;">
                    <p style="margin: 0; color: #999999; font-size: 11px; font-style: italic;">
                      This is an automated email. Please do not reply to this message.<br>
                      For any queries, please contact your system administrator.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  },

  /**
   * Test email configuration
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Simple test to verify API key is valid
      if (!process.env.RESEND_API_KEY) {
        return {
          success: false,
          error: 'RESEND_API_KEY not configured',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
