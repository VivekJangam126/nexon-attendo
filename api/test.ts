import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Simple test endpoint to verify API structure is working
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[Test API] Request received:', {
      method: req.method,
      url: req.url,
      body: req.body
    });

    return res.status(200).json({
      success: true,
      message: 'API is working correctly',
      timestamp: new Date().toISOString(),
      method: req.method,
      body: req.body
    });

  } catch (error: any) {
    console.error('[Test API] Error:', error);
    return res.status(500).json({
      error: error.message || 'Test API failed',
      stack: error.stack
    });
  }
}