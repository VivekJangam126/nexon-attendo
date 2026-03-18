"""
Flask API server for Deep Learning Face Recognition Service
Using FaceNet and MTCNN for state-of-the-art face recognition
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
from PIL import Image
import io
import time
import numpy as np
from config import Config
from face_service_deeplearning import DeepLearningFaceService

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize deep learning face service (this may take a moment)
print("🚀 Initializing Deep Learning Face Recognition Service...")
try:
    face_service = DeepLearningFaceService()
    SERVICE_READY = True
    print("✅ Deep Learning service initialized successfully!")
except Exception as e:
    print(f"❌ Failed to initialize deep learning service: {e}")
    print("💡 Make sure you have installed the deep learning requirements:")
    print("   pip install -r requirements-deeplearning.txt")
    SERVICE_READY = False
    face_service = None

# In-memory storage for face embeddings
face_embeddings = {}

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
    """Health check endpoint with model information"""
    if not SERVICE_READY:
        return jsonify({
            'status': 'error',
            'service': 'face-recognition-deeplearning',
            'version': '2.0.0-deeplearning',
            'error': 'Deep learning models not loaded',
            'registered_faces': 0
        }), 503
    
    model_info = face_service.get_model_info()
    
    return jsonify({
        'status': 'healthy',
        'service': 'face-recognition-deeplearning',
        'version': '2.0.0-deeplearning',
        'registered_faces': len(face_embeddings),
        'model_info': model_info
    }), 200

@app.route('/register-face', methods=['POST'])
def register_face():
    """Register employee face using deep learning"""
    if not SERVICE_READY:
        return jsonify({
            'success': False,
            'message': 'Deep learning service not available'
        }), 503
    
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        image_base64 = data.get('image')
        
        print(f"🔄 Deep learning registration request for: {employee_id}")
        
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
        
        # Register face using deep learning
        result = face_service.register_face(employee_id, image)
        
        if result['success']:
            # Store embedding in memory
            face_embeddings[employee_id] = {
                'embedding': result['embedding'],
                'registered_at': time.time(),
                'detection_confidence': result.get('detection_confidence', 0.0),
                'embedding_dimensions': result.get('embedding_dimensions', 512)
            }
            
            print(f"✅ Face registered successfully for {employee_id}")
            print(f"📊 Total registered faces: {len(face_embeddings)}")
        
        return jsonify(result), 200 if result['success'] else 400
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({
            'success': False,
            'message': f'Registration error: {str(e)}'
        }), 500

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """Verify employee face using deep learning"""
    if not SERVICE_READY:
        return jsonify({
            'success': False,
            'verified': False,
            'message': 'Deep learning service not available'
        }), 503
    
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        selfie_base64 = data.get('selfie')
        
        print(f"🔍 Deep learning verification request for: {employee_id}")
        
        if not employee_id or not selfie_base64:
            return jsonify({
                'success': False,
                'verified': False,
                'message': 'employee_id and selfie are required'
            }), 400
        
        # Check if face is registered
        if employee_id not in face_embeddings:
            print(f"❌ No registered face found for {employee_id}")
            return jsonify({
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': 'No registered face found',
                'faces_detected': 0
            }), 400
        
        # Get stored embedding
        stored_data = face_embeddings[employee_id]
        stored_embedding = np.array(stored_data['embedding'])
        
        # Convert selfie to PIL Image
        selfie_image = base64_to_image(selfie_base64)
        if selfie_image is None:
            return jsonify({
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': 'Invalid selfie format'
            }), 400
        
        # Verify face using deep learning
        result = face_service.verify_face(stored_embedding, selfie_image, employee_id)
        
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
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify({
                'registered': False,
                'message': 'employee_id is required'
            }), 400
        
        is_registered = employee_id in face_embeddings
        
        if is_registered:
            stored_data = face_embeddings[employee_id]
            message = f'Face registered with {stored_data["embedding_dimensions"]} dimensions'
        else:
            message = 'No face registered'
        
        print(f"📋 Registration check for {employee_id}: {is_registered}")
        
        return jsonify({
            'registered': is_registered,
            'message': message
        }), 200
        
    except Exception as e:
        print(f"❌ Check error: {e}")
        return jsonify({
            'registered': False,
            'message': f'Check error: {str(e)}'
        }), 500

@app.route('/debug', methods=['GET'])
def debug_info():
    """Debug endpoint with detailed information"""
    debug_data = {}
    
    for emp_id, data in face_embeddings.items():
        debug_data[emp_id] = {
            'embedding_dimensions': data.get('embedding_dimensions', 0),
            'detection_confidence': data.get('detection_confidence', 0.0),
            'registered_at': data.get('registered_at', 0),
            'has_embedding': data.get('embedding') is not None
        }
    
    response = {
        'service_ready': SERVICE_READY,
        'registered_employees': list(face_embeddings.keys()),
        'total_registered': len(face_embeddings),
        'details': debug_data
    }
    
    if SERVICE_READY:
        response['model_info'] = face_service.get_model_info()
    
    return jsonify(response), 200

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get detailed model information"""
    if not SERVICE_READY:
        return jsonify({
            'error': 'Deep learning service not available'
        }), 503
    
    return jsonify(face_service.get_model_info()), 200

if __name__ == '__main__':
    if SERVICE_READY:
        print(f"🚀 Starting Deep Learning Face Recognition Service...")
        print(f"📍 Host: {Config.FLASK_HOST}")
        print(f"🔌 Port: {Config.FLASK_PORT}")
        print(f"🧠 Face Detection: MTCNN (Multi-task CNN)")
        print(f"🎯 Face Recognition: FaceNet (InceptionResnetV1)")
        print(f"📊 Embedding Dimensions: 512")
        print(f"🔧 Confidence Threshold: 85%")
        print(f"🐛 Debug endpoint: /debug")
        print(f"📋 Model info: /model-info")
    else:
        print(f"❌ Service starting in ERROR mode - deep learning not available")
    
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=Config.DEBUG
    )