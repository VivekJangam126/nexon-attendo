"""
Flask API server for Windows-Compatible Accurate Face Recognition
Using MediaPipe for face detection and advanced feature extraction
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
from PIL import Image
import io
import time
from config import Config
from face_service_mediapipe import MediaPipeFaceService

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize MediaPipe face service
print("🚀 Initializing Windows-Compatible Accurate Face Recognition...")
try:
    face_service = MediaPipeFaceService()
    SERVICE_READY = True
    print("✅ MediaPipe face service initialized successfully!")
except Exception as e:
    print(f"❌ Failed to initialize MediaPipe face service: {e}")
    print("💡 Make sure you have installed: pip install -r requirements-windows-accurate.txt")
    SERVICE_READY = False
    face_service = None

def base64_to_image(base64_string):
    """Convert base64 string to PIL Image"""
    try:
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        return image
    except Exception as e:
        print(f"Error converting base64 to image: {e}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    if not SERVICE_READY:
        return jsonify({
            'status': 'error',
            'service': 'face-recognition-windows-accurate',
            'version': '4.0.0-windows-accurate',
            'error': 'MediaPipe face service not loaded'
        }), 503
    
    registered_employees = face_service.get_registered_employees()
    
    return jsonify({
        'status': 'healthy',
        'service': 'face-recognition-windows-accurate',
        'version': '4.0.0-windows-accurate',
        'registered_faces': len(registered_employees),
        'storage_method': 'Local file system',
        'face_detection': 'MediaPipe',
        'feature_extraction': 'Advanced (Landmarks + Histograms + Texture)',
        'confidence_threshold': face_service.confidence_threshold,
        'windows_compatible': True
    }), 200

@app.route('/register-face', methods=['POST'])
def register_face():
    """Register employee face with MediaPipe"""
    if not SERVICE_READY:
        return jsonify({
            'success': False,
            'message': 'MediaPipe face service not available'
        }), 503
    
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        image_base64 = data.get('image')
        
        print(f"🔄 Windows-accurate registration request for: {employee_id}")
        
        if not employee_id or not image_base64:
            return jsonify({
                'success': False,
                'message': 'employee_id and image are required'
            }), 400
        
        # Convert base64 to PIL Image
        image = base64_to_image(image_base64)
        if image is None:
            return jsonify({
                'success': False,
                'message': 'Invalid image format'
            }), 400
        
        # Register face with MediaPipe
        result = face_service.register_face(employee_id, image)
        
        if result['success']:
            print(f"✅ Face registered successfully for {employee_id}")
            registered_count = len(face_service.get_registered_employees())
            print(f"📊 Total registered faces: {registered_count}")
        
        return jsonify(result), 200 if result['success'] else 400
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({
            'success': False,
            'message': f'Registration error: {str(e)}'
        }), 500

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """Verify employee face with MediaPipe"""
    if not SERVICE_READY:
        return jsonify({
            'success': False,
            'verified': False,
            'message': 'MediaPipe face service not available'
        }), 503
    
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        selfie_base64 = data.get('selfie')
        
        print(f"🔍 Windows-accurate verification request for: {employee_id}")
        
        if not employee_id or not selfie_base64:
            return jsonify({
                'success': False,
                'verified': False,
                'message': 'employee_id and selfie are required'
            }), 400
        
        # Convert selfie to PIL Image
        selfie_image = base64_to_image(selfie_base64)
        if selfie_image is None:
            return jsonify({
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': 'Invalid selfie format'
            }), 400
        
        # Verify face with MediaPipe
        result = face_service.verify_face(employee_id, selfie_image)
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return jsonify({
            'success': False,
            'verified': False,
            'confidence': 0.0,
            'message': f'Verification error: {str(e)}'
        }), 500

@app.route('/check-registration', methods=['POST'])
def check_registration():
    """Check if employee has registered face"""
    if not SERVICE_READY:
        return jsonify({
            'registered': False,
            'message': 'Service not available'
        }), 503
    
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify({
                'registered': False,
                'message': 'employee_id is required'
            }), 400
        
        result = face_service.check_face_registered(employee_id)
        
        print(f"📋 Registration check for {employee_id}: {result['registered']}")
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Check error: {e}")
        return jsonify({
            'registered': False,
            'message': f'Check error: {str(e)}'
        }), 500

@app.route('/debug', methods=['GET'])
def debug_info():
    """Debug endpoint with detailed information"""
    if not SERVICE_READY:
        return jsonify({
            'service_ready': False,
            'error': 'Service not available'
        }), 503
    
    registered_employees = face_service.get_registered_employees()
    
    debug_data = {}
    for emp_id in registered_employees:
        status = face_service.check_face_registered(emp_id)
        debug_data[emp_id] = {
            'has_features': status['has_features'],
            'has_image': status['has_image'],
            'fully_registered': status['registered']
        }
    
    return jsonify({
        'service_ready': SERVICE_READY,
        'registered_employees': registered_employees,
        'total_registered': len(registered_employees),
        'storage_path': str(face_service.storage_path.absolute()),
        'confidence_threshold': face_service.confidence_threshold,
        'face_detection': 'MediaPipe',
        'windows_compatible': True,
        'details': debug_data
    }), 200

if __name__ == '__main__':
    if SERVICE_READY:
        print(f"🚀 Starting Windows-Compatible Accurate Face Recognition...")
        print(f"📍 Host: {Config.FLASK_HOST}")
        print(f"🔌 Port: {Config.FLASK_PORT}")
        print(f"🎯 Face Detection: MediaPipe")
        print(f"📊 Features: Landmarks + Histograms + Texture")
        print(f"📁 Storage: Local file system")
        print(f"🔧 Confidence Threshold: {face_service.confidence_threshold}")
        print(f"💻 Windows Compatible: Yes")
        print(f"🐛 Debug endpoint: /debug")
    else:
        print(f"❌ Service starting in ERROR mode")
        print(f"💡 Install with: pip install -r requirements-windows-accurate.txt")
    
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=Config.DEBUG
    )