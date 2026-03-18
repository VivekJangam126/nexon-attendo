"""
Fast Accurate Face Recognition Flask App
Optimized for speed while maintaining high accuracy
Processes 50 photos efficiently with smart sampling
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
from PIL import Image
import time
import traceback
from face_service_fast_accurate import FastAccurateFaceService

app = Flask(__name__)
CORS(app)

# Initialize fast accurate face service
face_service = FastAccurateFaceService(
    storage_path="face_storage",
    confidence_threshold=0.85  # 85% threshold for high accuracy
)

print("🚀 Starting Fast Accurate Face Recognition ML Service...")
print("📍 Host: 0.0.0.0")
print("🔌 Port: 5000")
print(f"🎯 Confidence Threshold: {face_service.confidence_threshold * 100}%")
print("📸 Optimized for 50 photo burst registration with fast processing")
print("🧠 Features: Smart sampling + Optimized feature extraction")
print("🔧 Methods: Efficient LBP + Key photo selection")
print("⚡ Performance: Sub-30 second processing with high accuracy")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Fast Accurate Face Recognition',
        'version': '5.0.0',
        'confidence_threshold': face_service.confidence_threshold,
        'storage_path': str(face_service.storage_path),
        'timestamp': time.time(),
        'features': [
            'Fast burst mode registration (50 photos in <30s)',
            'Smart photo sampling and selection',
            'Optimized feature extraction',
            'High accuracy discrimination',
            '85% confidence threshold',
            'Quality-based photo filtering',
            'Efficient verification'
        ]
    })

@app.route('/register-face', methods=['POST'])
def register_face():
    """Register face using multiple photos (fast burst mode)"""
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
        face_photos = data.get('face_photos', [])
        
        # Support both single image and multiple images
        if 'image' in data and not face_photos:
            face_photos = [data['image']]
        
        if not employee_id or not face_photos:
            return jsonify({
                'success': False,
                'message': 'Missing employee_id or face_photos data',
                'encoding_saved': False,
                'faces_detected': 0
            }), 400
        
        print(f"📝 Fast registration for: {employee_id}")
        print(f"📸 Processing {len(face_photos)} photos with optimization")
        
        # Decode all photos
        photos = []
        for i, photo_data in enumerate(face_photos):
            try:
                if photo_data.startswith('data:image'):
                    photo_data = photo_data.split(',')[1]
                
                image_bytes = base64.b64decode(photo_data)
                image_pil = Image.open(io.BytesIO(image_bytes))
                
                # Convert to RGB if necessary
                if image_pil.mode != 'RGB':
                    image_pil = image_pil.convert('RGB')
                
                photos.append(image_pil)
                
            except Exception as e:
                print(f"⚠️ Error decoding photo {i+1}: {e}")
                continue
        
        if not photos:
            return jsonify({
                'success': False,
                'message': 'No valid photos could be decoded',
                'encoding_saved': False,
                'faces_detected': 0
            }), 400
        
        # Register face with fast accurate service
        start_time = time.time()
        result = face_service.register_face(employee_id, photos)
        processing_time = (time.time() - start_time) * 1000
        
        result['processing_time_ms'] = processing_time
        result['processing_time_seconds'] = processing_time / 1000
        
        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ Fast registration error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}',
            'encoding_saved': False,
            'faces_detected': 0
        }), 500

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """Verify face against registered features (fast)"""
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
        
        print(f"🔍 Fast verification for: {employee_id}")
        
        # Decode selfie
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
        
        # Verify face with fast accurate service
        start_time = time.time()
        result = face_service.verify_face(employee_id, selfie_pil)
        processing_time = (time.time() - start_time) * 1000
        
        result['processing_time_ms'] = processing_time
        
        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ Fast verification error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'verified': False,
            'confidence': 0.0,
            'message': f'Server error: {str(e)}',
            'faces_detected': 0
        }), 500

@app.route('/registration-info/<employee_id>', methods=['GET'])
def get_registration_info(employee_id):
    """Get registration information for an employee"""
    try:
        result = face_service.get_registration_info(employee_id)
        return jsonify(result)
    except Exception as e:
        print(f"❌ Error getting registration info: {e}")
        return jsonify({
            'registered': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/debug', methods=['GET'])
def debug_info():
    """Debug endpoint for fast accurate service"""
    try:
        import os
        storage_info = {
            'employee_folders': [],
            'total_employees': 0,
            'total_photos': 0
        }
        
        if face_service.storage_path.exists():
            for item in face_service.storage_path.iterdir():
                if item.is_dir():
                    employee_info = {
                        'employee_id': item.name,
                        'folder_path': str(item),
                        'files': []
                    }
                    
                    photo_count = 0
                    for file in item.iterdir():
                        employee_info['files'].append(file.name)
                        if file.name.startswith('original_') and file.name.endswith('.jpg'):
                            photo_count += 1
                    
                    employee_info['photo_count'] = photo_count
                    storage_info['employee_folders'].append(employee_info)
                    storage_info['total_photos'] += photo_count
            
            storage_info['total_employees'] = len(storage_info['employee_folders'])
        
        return jsonify({
            'service': 'Fast Accurate Face Recognition',
            'version': '5.0.0',
            'confidence_threshold': face_service.confidence_threshold,
            'threshold_percentage': f"{face_service.confidence_threshold * 100}%",
            'storage_path': str(face_service.storage_path),
            'storage_exists': face_service.storage_path.exists(),
            'storage_structure': 'individual_employee_folders',
            'storage_info': storage_info,
            'features': [
                'Fast burst mode registration (50 photos in <30s)',
                'Smart photo sampling (selects best 10-15 photos)',
                'Individual employee folders',
                'Original photos saved as JPG files',
                'Optimized feature extraction',
                'Efficient LBP + gradient features',
                'Quality-based photo filtering',
                'High accuracy discrimination',
                '85% confidence threshold',
                'Sub-second verification'
            ],
            'timestamp': time.time()
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get service statistics"""
    try:
        registered_employees = 0
        total_photos = 0
        employee_folders = []
        
        if face_service.storage_path.exists():
            for item in face_service.storage_path.iterdir():
                if item.is_dir():
                    registered_employees += 1
                    
                    # Count photos in this employee's folder
                    photo_count = 0
                    for file in item.iterdir():
                        if file.name.startswith('original_') and file.name.endswith('.jpg'):
                            photo_count += 1
                    
                    total_photos += photo_count
                    employee_folders.append({
                        'employee_id': item.name,
                        'photo_count': photo_count
                    })
        
        return jsonify({
            'service': 'Fast Accurate Face Recognition',
            'registered_employees': registered_employees,
            'total_photos_stored': total_photos,
            'employee_folders': employee_folders,
            'confidence_threshold': face_service.confidence_threshold,
            'storage_path': str(face_service.storage_path),
            'storage_structure': 'individual_employee_folders',
            'uptime': time.time(),
            'status': 'operational',
            'optimization': 'smart_sampling_enabled'
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)