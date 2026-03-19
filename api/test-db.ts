import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Test database connection endpoint
 * GET /api/test-db - Test if database connection is working
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[Test DB API] Testing basic functionality...');

    // Test basic functionality first
    return res.status(200).json({
      success: true,
      message: 'API endpoint is working',
      timestamp: new Date().toISOString(),
      environment: {
        node_version: process.version,
        platform: process.platform
      }
    });

  } catch (error: any) {
    console.error('[Test DB API] Exception:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Test failed',
      stack: error.stack
    });
  }
}