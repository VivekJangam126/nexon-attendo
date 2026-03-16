"""
Minimal Flask API server for face recognition service
This version runs without dlib/face_recognition for testing
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'service': 'face-recognition-ml',
        'version': '1.0.0-minimal',
        'note': 'Running in minimal mode - face recognition disabled'
    }), 200

@app.route('/register-face', methods=['POST'])
def register_face():
    """
    Mock face registration (returns success but doesn't actually process)
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
        
        if not employee_id or not image_base64:
            return jsonify({
                'success': False,
                'message': 'employee_id and image are required'
            }), 400
        
        # Mock successful registration
        return jsonify({
            'success': True,
            'message': 'Face registration simulated (ML service in minimal mode)',
            'encoding_saved': True,  # Changed to True so database gets updated
            'faces_detected': 1,
            'processing_time_ms': 100
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """
    Mock face verification (returns success but doesn't actually verify)
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
        
        if not employee_id or not selfie_base64:
            return jsonify({
                'success': False,
                'verified': False,
                'message': 'employee_id and selfie are required'
            }), 400
        
        # Mock successful verification
        return jsonify({
            'success': True,
            'verified': True,
            'confidence': 85.0,
            'message': 'Face verification simulated (ML service in minimal mode)',
            'faces_detected': 1,
            'processing_time_ms': 150
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'verified': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/check-registration', methods=['POST'])
def check_registration():
    """
    Mock registration check
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
        
        # Mock registration status
        return jsonify({
            'registered': True,
            'message': 'Registration check simulated (ML service in minimal mode)'
        }), 200
    
    except Exception as e:
        return jsonify({
            'registered': False,
            'message': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print(f"🚀 Starting Face Recognition ML Service (Minimal Mode)...")
    print(f"📍 Host: 0.0.0.0")
    print(f"🔌 Port: 5000")
    print(f"⚠️  Note: Running in minimal mode - actual face recognition disabled")
    print(f"🔧 This allows testing the integration without dlib compilation issues")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )