"""
Advanced OpenCV Face Recognition Flask App
Uses local image storage and advanced feature extraction
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
from PIL import Image
import time
import traceback
import cv2
from face_service_opencv_advanced import AdvancedOpenCVFaceService

app = Flask(__name__)
CORS(app)

# Initialize face service
face_service = AdvancedOpenCVFaceService()

print("🚀 Starting Advanced OpenCV Face Recognition ML Service...")
print("📍 Host: 0.0.0.0")
print("🔌 Port: 5000")
print(f"🎯 Confidence Threshold: {face_service.confidence_threshold * 100}%")
print("🧠 Features: Advanced OpenCV with local storage")
print("🔧 Methods: Multiple face detection + Advanced feature extraction + Local file storage")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Advanced OpenCV Face Recognition',
        'version': '2.0.0',
        'confidence_threshold': face_service.confidence_threshold,
        'storage_path': str(face_service.storage_path),
        'timestamp': time.time()
    })

@app.route('/register-face', methods=['POST'])
def register_face():
    """Register a face for an employee"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No JSON data provided',
                'encoding_saved': False,
                'faces_detected': 0
            }), 400
        
        employee_id = data.get('employee_id')
        image_data = data.get('image')
        
        if not employee_id or not image_data:
            return jsonify({
                'success': False,
                'message': 'Missing employee_id or image data',
                'encoding_saved': False,
                'faces_detected': 0
            }), 400
        
        print(f"📝 Registration request for employee: {employee_id}")
        
        # Decode base64 image
        try:
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            image_pil = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image_pil.mode != 'RGB':
                image_pil = image_pil.convert('RGB')
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Invalid image data: {str(e)}',
                'encoding_saved': False,
                'faces_detected': 0
            }), 400
        
        # Register face
        start_time = time.time()
        result = face_service.register_face(employee_id, image_pil)
        processing_time = (time.time() - start_time) * 1000
        
        result['processing_time_ms'] = processing_time
        
        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}',
            'encoding_saved': False,
            'faces_detected': 0
        }), 500

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """Verify a face against registered face"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': 'No JSON data provided',
                'faces_detected': 0
            }), 400
        
        employee_id = data.get('employee_id')
        selfie_data = data.get('selfie')
        
        if not employee_id or not selfie_data:
            return jsonify({
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': 'Missing employee_id or selfie data',
                'faces_detected': 0
            }), 400
        
        print(f"🔍 Verification request for employee: {employee_id}")
        
        # Decode base64 selfie
        try:
            if selfie_data.startswith('data:image'):
                selfie_data = selfie_data.split(',')[1]
            
            selfie_bytes = base64.b64decode(selfie_data)
            selfie_pil = Image.open(io.BytesIO(selfie_bytes))
            
            # Convert to RGB if necessary
            if selfie_pil.mode != 'RGB':
                selfie_pil = selfie_pil.convert('RGB')
                
        except Exception as e:
            return jsonify({
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': f'Invalid selfie data: {str(e)}',
                'faces_detected': 0
            }), 400
        
        # Verify face
        start_time = time.time()
        result = face_service.verify_face(employee_id, selfie_pil)
        processing_time = (time.time() - start_time) * 1000
        
        result['processing_time_ms'] = processing_time
        
        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ Verification error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'verified': False,
            'confidence': 0.0,
            'message': f'Server error: {str(e)}',
            'faces_detected': 0
        }), 500

@app.route('/debug', methods=['GET'])
def debug_info():
    """Debug endpoint to check service status"""
    try:
        import os
        storage_files = []
        if face_service.storage_path.exists():
            storage_files = [f.name for f in face_service.storage_path.iterdir()]
        
        return jsonify({
            'service': 'Advanced OpenCV Face Recognition',
            'version': '2.0.0',
            'confidence_threshold': face_service.confidence_threshold,
            'storage_path': str(face_service.storage_path),
            'storage_exists': face_service.storage_path.exists(),
            'storage_files': storage_files,
            'opencv_version': cv2.__version__ if 'cv2' in globals() else 'Not available',
            'timestamp': time.time()
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)