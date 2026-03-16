/**
 * Face Recognition API Endpoints
 * Handles face registration, verification, and status checking
 */

import { Request, Response } from 'express';
import { faceRecognitionService } from '../services/face-recognition.service';
import { authService } from '../services/auth.service';

/**
 * Main handler for face recognition API
 */
export default async function handler(req: Request, res: Response) {
  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathname = url.pathname.replace('/api/face-recognition', '');
    const method = req.method;

    // POST /api/face-recognition (main endpoint for frontend)
    if (pathname === '' && method === 'POST') {
      return await handleFaceRecognition(req, res);
    }

    // POST /api/face-recognition/register
    if (pathname === '/register' && method === 'POST') {
      return await registerFace(req, res);
    }

    // POST /api/face-recognition/verify
    if (pathname === '/verify' && method === 'POST') {
      return await verifyFace(req, res);
    }

    // GET /api/face-recognition/status/:employee_id
    if (pathname.startsWith('/status/') && method === 'GET') {
      return await getFaceStatus(req, res);
    }

    // POST /api/face-recognition/upload-photo
    if (pathname === '/upload-photo' && method === 'POST') {
      return await uploadPhoto(req, res);
    }

    // GET /api/face-recognition/service-status
    if (pathname === '/service-status' && method === 'GET') {
      return await getServiceStatus(req, res);
    }

    return res.status(404).json({
      success: false,
      message: 'Endpoint not found',
    });
  } catch (error) {
    console.error('Face recognition API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * POST /api/face-recognition
 * Main face recognition endpoint for frontend
 */
/**
 * POST /api/face-recognition
 * Main face recognition endpoint for frontend
 */
export async function handleFaceRecognition(req: Request, res: Response) {
  try {
    const { action, selfie, employee_id } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required',
      });
    }

    if (action === 'verify') {
      if (!selfie || !employee_id) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: 'Selfie and employee_id are required for verification',
        });
      }

      const result = await faceRecognitionService.verifyFace(
        employee_id,
        selfie
      );

      return res.status(200).json(result);
    }

    if (action === 'check-registration') {
      const targetEmployeeId = employee_id;
      
      if (!targetEmployeeId) {
        return res.status(400).json({
          registered: false,
          message: 'employee_id is required',
          mlServiceAvailable: false,
        });
      }

      const result = await faceRecognitionService.checkFaceRegistration(targetEmployeeId);
      const serviceStatus = await faceRecognitionService.isMLServiceAvailable();
      
      return res.status(200).json({
        registered: result.registered,
        message: result.message,
        mlServiceAvailable: serviceStatus,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid action',
    });
  } catch (error) {
    console.error('Face recognition API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * POST /api/face/register
 * Register employee face from uploaded photo
 */
/**
 * POST /api/face/register
 * Register employee face from uploaded photo
 */
export async function registerFace(req: Request, res: Response) {
  try {
    const { employee_id, image } = req.body;

    if (!employee_id || !image) {
      return res.status(400).json({
        success: false,
        message: 'employee_id and image are required',
      });
    }

    const result = await faceRecognitionService.registerFace(employee_id, image);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Face registration API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * POST /api/face/verify
 * Verify employee face during attendance
 */
/**
 * POST /api/face/verify
 * Verify employee face during attendance
 */
export async function verifyFace(req: Request, res: Response) {
  try {
    const { employee_id, selfie, attendance_id } = req.body;

    if (!employee_id || !selfie) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'employee_id and selfie are required',
      });
    }

    const result = await faceRecognitionService.verifyFace(
      employee_id,
      selfie,
      attendance_id
    );

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Face verification API error:', error);
    return res.status(500).json({
      success: false,
      verified: false,
      message: 'Internal server error',
    });
  }
}

/**
 * GET /api/face/status/:employee_id
 * Check face registration status for employee
 */
/**
 * GET /api/face/status/:employee_id
 * Check face registration status for employee
 */
export async function getFaceStatus(req: Request, res: Response) {
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({
        registered: false,
        message: 'employee_id is required',
      });
    }

    const result = await faceRecognitionService.checkFaceRegistration(employee_id);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Face status API error:', error);
    return res.status(500).json({
      registered: false,
      message: 'Internal server error',
    });
  }
}

/**
 * POST /api/face/upload-photo
 * Upload profile photo and register face
 */
export async function uploadPhoto(req: Request, res: Response) {
  try {
    const { employee_id } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'employee_id is required',
      });
    }

    // Verify authentication
    const authResult = await authService.verifySession(req);
    if (!authResult.success || !authResult.profile) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Only admins can upload photos for other employees
    if (authResult.profile.role !== 'admin' && authResult.profile.id !== employee_id) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Photo file is required',
      });
    }

    const result = await faceRecognitionService.uploadAndRegisterPhoto(
      employee_id,
      req.file as any
    );

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Photo upload API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * GET /api/face/service-status
 * Get ML service status and statistics
 */
export async function getServiceStatus(req: Request, res: Response) {
  try {
    // Verify admin authentication
    const authResult = await authService.verifySession(req);
    if (!authResult.success || !authResult.profile) {
      return res.status(401).json({
        available: false,
        message: 'Authentication required',
      });
    }

    if (authResult.profile.role !== 'admin') {
      return res.status(403).json({
        available: false,
        message: 'Admin access required',
      });
    }

    const result = await faceRecognitionService.getServiceStatus();

    return res.status(200).json(result);
  } catch (error) {
    console.error('Service status API error:', error);
    return res.status(500).json({
      available: false,
      message: 'Internal server error',
    });
  }
}