"""
Flask API server for face recognition service using simplified approach
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from config import Config
from face_service_simple import FaceRecognitionService

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize face recognition service
face_service = FaceRecognitionService()

# Create necessary directories
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(Config.TEMP_FOLDER, exist_ok=True)

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'service': 'face-recognition-ml-simple',
        'version': '1.0.0',
        'confidence_threshold': face_service.confidence_threshold
    }), 200

@app.route('/register-face', methods=['POST'])
def register_face():
    """
    Register employee face
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        employee_id = data.get('employee_id')
        image_base64 = data.get('image')
        
        if not employee_id:
            return jsonify({
                'success': False,
                'message': 'employee_id is required'
            }), 400
        
        if not image_base64:
            return jsonify({
                'success': False,
                'message': 'image is required'
            }), 400
        
        # Register face
        result = face_service.register_face(employee_id, image_base64)
        
        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """
    Verify employee face during attendance
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'verified': False,
                'message': 'No data provided'
            }), 400
        
        employee_id = data.get('employee_id')
        selfie_base64 = data.get('selfie')
        attendance_id = data.get('attendance_id')
        
        if not employee_id:
            return jsonify({
                'success': False,
                'verified': False,
                'message': 'employee_id is required'
            }), 400
        
        if not selfie_base64:
            return jsonify({
                'success': False,
                'verified': False,
                'message': 'selfie is required'
            }), 400
        
        # Verify face
        result = face_service.verify_face(employee_id, selfie_base64, attendance_id)
        
        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code
    
    except Exception as e:
        return jsonify({
            'success': False,
            'verified': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/check-registration', methods=['POST'])
def check_registration():
    """
    Check if employee has registered face
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'registered': False,
                'message': 'No data provided'
            }), 400
        
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify({
                'registered': False,
                'message': 'employee_id is required'
            }), 400
        
        # Check registration
        result = face_service.check_face_registered(employee_id)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({
            'registered': False,
            'message': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print(f"🚀 Starting Simplified Face Recognition ML Service...")
    print(f"📍 Host: {Config.FLASK_HOST}")
    print(f"🔌 Port: {Config.FLASK_PORT}")
    print(f"🔍 Detection Model: OpenCV Haar Cascades (Simplified)")
    print(f"🎯 Confidence Threshold: {face_service.confidence_threshold}%")
    
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=Config.DEBUG
    )