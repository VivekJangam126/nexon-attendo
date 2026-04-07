import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Set environment variables from .env file
  // WARNING: Do NOT add hardcoded fallback values for API keys/secrets here
  // All sensitive credentials must be provided via environment variables only
  process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.RESEND_API_KEY = env.RESEND_API_KEY;
  process.env.TWILIO_ACCOUNT_SID = env.TWILIO_ACCOUNT_SID;
  process.env.TWILIO_AUTH_TOKEN = env.TWILIO_AUTH_TOKEN;
  process.env.TWILIO_PHONE_NUMBER = env.TWILIO_PHONE_NUMBER;
  process.env.GOOGLE_CALENDAR_API_KEY = env.GOOGLE_CALENDAR_API_KEY;
  
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
          // Initialize holiday sync on server start
          (async () => {
            try {
              const { initializeHolidaySync } = await import('./server/startup/holiday-sync-startup.ts');
              await initializeHolidaySync();
            } catch (error) {
              console.error('[Vite] Failed to initialize holiday sync:', error);
            }
          })();

          server.middlewares.use(async (req: any, res: any, next: any) => {
            // Handle all /api/ routes
            if (req.url?.startsWith('/api/')) {
              // Handle CORS
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-role');

              if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
              }

              try {
                // Parse URL to get the API path
                const url = new URL(req.url, `http://${req.headers.host}`);
                const pathname = url.pathname.replace('/api/', '');
                const parts = pathname.split('/');
                
                console.log('[API Middleware] Incoming request:', req.method, req.url);
                console.log('[API Middleware] Pathname:', pathname);
                
                // Determine which handler to use
                let handler;
                
                try {
                  if (pathname.startsWith('admin/leave/')) {
                    const action = parts[2]; // e.g., 'requests', 'approve', 'reject'
                    console.log('[API Middleware] Loading admin/leave handler:', action);
                    handler = await import(`./server/api/admin/leave/${action}.ts`);
                  } else if (pathname.startsWith('leave/')) {
                    const action = parts[1]; // e.g., 'apply', 'balance', 'my-requests'
                    console.log('[API Middleware] Loading leave handler:', action);
                    handler = await import(`./server/api/leave/${action}.ts`);
                  } else if (pathname.startsWith('payroll')) {
                    console.log('[API Middleware] Loading payroll handler');
                    handler = await import('./server/api/payroll.ts');
                  } else if (pathname.startsWith('employees')) {
                    console.log('[API Middleware] Loading employees handler');
                    handler = await import('./server/api/employees.ts');
                  } else if (pathname.startsWith('send-report-email')) {
                    console.log('[API Middleware] Loading send-report-email handler');
                    handler = await import('./server/api/send-report-email.ts');
                  } else if (pathname.startsWith('send-notification')) {
                    console.log('[API Middleware] Loading send-notification handler');
                    handler = await import('./server/api/send-notification.ts');
                  } else if (pathname.startsWith('upload-photo')) {
                    console.log('[API Middleware] Loading upload-photo handler');
                    handler = await import('./server/api/upload-photo.ts');
                  } else if (pathname.startsWith('holidays')) {
                    console.log('[API Middleware] Loading holidays handler');
                    handler = await import('./server/api/holidays.ts');
                  } else {
                    console.log('[API Middleware] No handler found for path:', pathname);
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Not found' }));
                    return;
                  }
                } catch (importError: any) {
                  console.error('[API Middleware] Failed to import handler for path:', pathname, 'Error:', importError.message);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Handler not found', path: pathname, details: importError.message }));
                  return;
                }

                // Parse body
                let body = '';
                
                // Only parse body for POST, PUT, PATCH requests
                if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
                  await new Promise<void>((resolve) => {
                    req.on('data', (chunk: any) => {
                      body += chunk.toString();
                    });
                    req.on('end', () => {
                      resolve();
                    });
                  });
                }
                
                let requestData = {};
                if (body) {
                  try {
                    requestData = JSON.parse(body);
                    console.log('[API Middleware] Parsed body:', requestData);
                  } catch (parseError) {
                    console.error('[API Middleware] Failed to parse body:', body);
                    console.error('[API Middleware] Parse error:', parseError);
                  }
                }

                // Convert URLSearchParams to object for query
                const query: any = {};
                url.searchParams.forEach((value, key) => {
                  query[key] = value;
                });

                // Create mock request/response
                const mockReq = {
                  method: req.method,
                  headers: req.headers,
                  url: req.url,
                  query: query,
                  body: requestData,
                  params: {}, // Add params for route parameters
                } as any;

                const mockRes = {
                  statusCode: 200,
                  status: (code: number) => {
                    mockRes.statusCode = code;
                    return mockRes;
                  },
                  json: (data: any) => {
                    res.statusCode = mockRes.statusCode;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                  setHeader: (key: string, value: string) => {
                    res.setHeader(key, value);
                  },
                  end: (data?: any) => {
                    res.end(data);
                  },
                } as any;

                await handler.default(mockReq, mockRes);
              } catch (error: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  error: error.message || 'Internal server error',
                }));
              }
              return;
            }
            next();
          });
        },
      },
    ].filter(Boolean),
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Extract html2canvas into its own chunk to reduce main bundle
            'html2canvas': ['html2canvas'],
            // Extract large UI libraries into separate chunks
            'radix-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
            // Extract date/time libraries
            'date-fns': ['date-fns'],
          },
        },
      },
      // Increase chunk size warning limit slightly since we're optimizing
      chunkSizeWarningLimit: 600,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@server": path.resolve(__dirname, "./server"),
      },
    },
  };
});
