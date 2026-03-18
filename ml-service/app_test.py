"""
Flask API server for face recognition service - TESTING VERSION
This version will always pass face verification for testing the flow
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from config import Config

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
        'service': 'face-recognition-ml-test',
        'version': '1.0.0-test',
        'note': 'Testing version - always passes verification'
    }), 200

@app.route('/register-face', methods=['POST'])
def register_face():
    """
    Register employee face - TESTING VERSION
    """
    try:
        data = request.get_json()
        
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify({
                'success': False,
                'message': 'employee_id is required'
            }), 400
        
        # Always return success for testing
        return jsonify({
            'success': True,
            'message': 'Face registered successfully (TEST MODE)',
            'encoding_saved': True,
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
    Verify employee face - TESTING VERSION (always passes)
    """
    try:
        data = request.get_json()
        
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify({
                'success': False,
                'verified': False,
                'message': 'employee_id is required'
            }), 400
        
        # Always return successful verification for testing
        return jsonify({
            'success': True,
            'verified': True,
            'confidence': 85.5,
            'message': 'Face verified successfully (TEST MODE - Confidence: 85.5%)',
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
    Check if employee has registered face - TESTING VERSION
    """
    try:
        # Always return registered for testing
        return jsonify({
            'registered': True,
            'message': 'Face is registered (TEST MODE)'
        }), 200
    
    except Exception as e:
        return jsonify({
            'registered': False,
            'message': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print(f"🧪 Starting TESTING Face Recognition ML Service...")
    print(f"⚠️  WARNING: This is a TEST version that always passes verification!")
    print(f"📍 Host: {Config.FLASK_HOST}")
    print(f"🔌 Port: {Config.FLASK_PORT}")
    print(f"🎯 Mode: TESTING (Always passes)")
    
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=Config.DEBUG
    )