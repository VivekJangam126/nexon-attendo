/**
 * Simple test API handler to verify the middleware is working
 */
export default async function handler(req: any, res: any) {
  try {
    console.log('[Test API] Request received:', {
      method: req.method,
      url: req.url,
      body: req.body
    });

    return res.status(200).json({
      success: true,
      message: 'API middleware is working correctly',
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