import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8081,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      // API middleware plugin
      {
        name: 'api-middleware',
        configureServer(server: any) {
          server.middlewares.use(async (req: any, res: any, next: any) => {
            // Handle send-report-email endpoint
            if (req.url?.startsWith('/api/send-report-email')) {
              // Handle CORS
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

              if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
              }

              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }

              try {
                // Parse body
                let body = '';
                req.on('data', (chunk: any) => {
                  body += chunk.toString();
                });
                
                await new Promise(resolve => req.on('end', resolve));
                
                const requestData = JSON.parse(body || '{}');

                // Get auth header
                const authHeader = req.headers.authorization;
                if (!authHeader) {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Unauthorized' }));
                  return;
                }

                // Set environment variables for the API handler
                process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://falbkccaqjqdbvrmdlll.supabase.co';
                process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
                process.env.RESEND_API_KEY = env.RESEND_API_KEY || 're_8Mrzs5LU_2KqbP99nDzBevCMUstapBqCE';
                process.env.REPORT_FROM_EMAIL = env.REPORT_FROM_EMAIL || 'admin@nexus.com';
                process.env.DEFAULT_HR_EMAIL = env.DEFAULT_HR_EMAIL || 'vivekjangam9767@gmail.com';

                // Import the handler
                const handler = await import('./server/api/send-report-email');
                
                // Create mock Vercel request/response
                const mockReq = {
                  method: 'POST',
                  headers: req.headers,
                  body: requestData,
                } as any;

                const mockRes = {
                  status: (code: number) => {
                    res.statusCode = code;
                    return mockRes;
                  },
                  json: (data: any) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                } as any;

                await handler.default(mockReq, mockRes);
              } catch (error: any) {
                console.error('API error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: error.message || 'Failed to send report email',
                }));
              }
              return;
            }
            
            // Handle send-notification endpoint
            if (req.url?.startsWith('/api/send-notification')) {
              // Handle CORS
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

              if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
              }

              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }

              try {
                // Parse body first
                let body = '';
                req.on('data', (chunk: any) => {
                  body += chunk.toString();
                });
                
                await new Promise(resolve => req.on('end', resolve));
                
                const requestData = JSON.parse(body || '{}');

                // Set environment variables
                process.env.VITE_SUPABASE_URL = 'https://falbkccaqjqdbvrmdlll.supabase.co';
                process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw';
                process.env.RESEND_API_KEY = env.RESEND_API_KEY || 're_8Mrzs5LU_2KqbP99nDzBevCMUstapBqCE';
                process.env.TWILIO_ACCOUNT_SID = env.TWILIO_ACCOUNT_SID || 'AC83466c365ec477f3e45b636ae2f27b2c';
                process.env.TWILIO_AUTH_TOKEN = env.TWILIO_AUTH_TOKEN || '0003ee92846543982cde08a030533ef4';
                process.env.TWILIO_PHONE_NUMBER = env.TWILIO_PHONE_NUMBER || '+16509551246';
                
                // Import dependencies
                const { createClient } = await import('@supabase/supabase-js');
                const { notificationService } = await import('./server/services/notification.service');

                // Create Supabase client
                const supabase = createClient(
                  'https://falbkccaqjqdbvrmdlll.supabase.co',
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGJrY2NhcWpxZGJ2cm1kbGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTE4NTQsImV4cCI6MjA4NjI2Nzg1NH0.FkwmwhprYiu7vtXhfGLE_zPmB6-9cbF7uNFqFu7qwVw'
                );

                // Get enabled contacts directly
                const { data: contacts, error: contactsError } = await supabase
                  .from('notification_contacts')
                  .select('*')
                  .eq('is_enabled', true);
                
                if (contactsError) {
                  throw contactsError;
                }

                if (!contacts || contacts.length === 0) {
                  throw new Error('No enabled contacts found');
                }

                // Prepare notification data
                const notificationData = {
                  date: new Date().toISOString().split('T')[0],
                  slotNumber: requestData.slotNumber,
                  slotTime: requestData.slotTime,
                  presentCount: requestData.presentCount,
                  lateCount: requestData.lateCount,
                  totalCount: requestData.totalCount,
                  attendanceRate: requestData.attendanceRate,
                  isManual: requestData.isManual || true, // Flag for manual alerts
                };

                // Prepare recipients
                const recipients = contacts.map((contact: any) => ({
                  name: contact.name,
                  email: contact.email || undefined,
                  phone: contact.phone || undefined,
                }));

                // Send notifications
                const results = await notificationService.sendBulkNotifications(recipients, notificationData);

                // Count successes and failures
                let emailsSent = 0;
                let emailsFailed = 0;
                let smsSent = 0;
                let smsFailed = 0;

                // Process email results
                for (const result of results.emailResults) {
                  if (result.result.success) {
                    emailsSent++;
                  } else {
                    emailsFailed++;
                  }

                  // Log to history
                  await supabase.from('notification_history').insert({
                    slot_number: requestData.slotNumber,
                    slot_time: requestData.slotTime,
                    notification_date: notificationData.date,
                    recipient_email: result.recipient,
                    notification_type: 'email',
                    status: result.result.success ? 'success' : 'failed',
                    message_id: result.result.messageId || null,
                    error_message: result.result.error || null,
                    attendance_data: notificationData,
                    triggered_by: requestData.triggeredBy,
                    is_manual: requestData.isManual || true
                  });
                }

                // Process SMS results
                for (const result of results.smsResults) {
                  if (result.result.success) {
                    smsSent++;
                  } else {
                    smsFailed++;
                  }

                  // Log to history
                  await supabase.from('notification_history').insert({
                    slot_number: requestData.slotNumber,
                    slot_time: requestData.slotTime,
                    notification_date: notificationData.date,
                    recipient_phone: result.recipient,
                    notification_type: 'sms',
                    status: result.result.success ? 'success' : 'failed',
                    message_id: result.result.messageId || null,
                    error_message: result.result.error || null,
                    attendance_data: notificationData,
                    triggered_by: requestData.triggeredBy,
                    is_manual: requestData.isManual || true
                  });
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  emailsSent,
                  smsSent,
                  emailsFailed,
                  smsFailed,
                  totalContacts: contacts.length,
                }));
              } catch (error: any) {
                console.error('API error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: error.message || 'Failed to send notifications',
                }));
              }
              return;
            }
            next();
          });
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@server": path.resolve(__dirname, "./server"),
      },
    },
  };
});
