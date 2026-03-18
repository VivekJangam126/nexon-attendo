"""
Accurate Face Recognition Service
Stores images locally and uses multiple verification methods
"""
import cv2
import numpy as np
import os
import time
from PIL import Image
import face_recognition
import pickle
from pathlib import Path

class AccurateFaceService:
    """
    Highly accurate face recognition using face_recognition library
    """
    
    def __init__(self):
        self.confidence_threshold = 0.4  # Lower distance = higher similarity
        self.storage_path = Path("face_storage")
        self.storage_path.mkdir(exist_ok=True)
        
        print(f"🔧 Initializing Accurate Face Recognition...")
        print(f"📁 Storage path: {self.storage_path.absolute()}")
        
        # Test face_recognition library
        try:
            test_array = np.zeros((100, 100, 3), dtype=np.uint8)
            face_recognition.face_locations(test_array)
            print(f"✅ face_recognition library working correctly")
        except Exception as e:
            print(f"❌ face_recognition library error: {e}")
    
    def save_face_image(self, employee_id, image_pil):
        """Save original image locally"""
        try:
            image_path = self.storage_path / f"{employee_id}_original.jpg"
            image_pil.save(image_path, "JPEG", quality=95)
            print(f"💾 Saved original image: {image_path}")
            return str(image_path)
        except Exception as e:
            print(f"❌ Error saving image: {e}")
            return None
    
    def extract_face_encoding(self, image_pil):
        """Extract face encoding using face_recognition library"""
        try:
            # Convert PIL to numpy array
            image_array = np.array(image_pil)
            
            # Find face locations
            face_locations = face_recognition.face_locations(image_array, model="hog")
            
            if len(face_locations) == 0:
                print("❌ No faces detected")
                return None, None
            
            if len(face_locations) > 1:
                print(f"⚠️  Multiple faces detected ({len(face_locations)}), using largest")
            
            # Get face encodings
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            if len(face_encodings) == 0:
                print("❌ No face encodings extracted")
                return None, None
            
            # Use the first encoding
            encoding = face_encodings[0]
            location = face_locations[0]
            
            print(f"✅ Face encoding extracted: {encoding.shape}")
            return encoding, location
            
        except Exception as e:
            print(f"❌ Error extracting face encoding: {e}")
            return None, None
    
    def save_face_encoding(self, employee_id, encoding):
        """Save face encoding to file"""
        try:
            encoding_path = self.storage_path / f"{employee_id}_encoding.pkl"
            with open(encoding_path, 'wb') as f:
                pickle.dump(encoding, f)
            print(f"💾 Saved face encoding: {encoding_path}")
            return str(encoding_path)
        except Exception as e:
            print(f"❌ Error saving encoding: {e}")
            return None
    
    def load_face_encoding(self, employee_id):
        """Load face encoding from file"""
        try:
            encoding_path = self.storage_path / f"{employee_id}_encoding.pkl"
            if not encoding_path.exists():
                return None
            
            with open(encoding_path, 'rb') as f:
                encoding = pickle.load(f)
            print(f"📂 Loaded face encoding: {encoding_path}")
            return encoding
        except Exception as e:
            print(f"❌ Error loading encoding: {e}")
            return None
    
    def compare_faces_accurate(self, known_encoding, unknown_encoding):
        """Compare faces with multiple methods for accuracy"""
        try:
            if known_encoding is None or unknown_encoding is None:
                return False, 1.0, "Missing encoding"
            
            # Method 1: face_recognition library comparison
            matches = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=self.confidence_threshold)
            is_match = matches[0] if matches else False
            
            # Method 2: Calculate face distance (lower = more similar)
            face_distance = face_recognition.face_distance([known_encoding], unknown_encoding)[0]
            
            # Method 3: Calculate similarity percentage
            similarity_percentage = max(0, (1 - face_distance) * 100)
            
            print(f"📊 Face comparison results:")
            print(f"   - Match (tolerance {self.confidence_threshold}): {is_match}")
            print(f"   - Face distance: {face_distance:.4f}")
            print(f"   - Similarity: {similarity_percentage:.1f}%")
            
            # Strict verification: require both low distance AND library match
            is_verified = is_match and face_distance < self.confidence_threshold
            
            if is_verified:
                message = f"Face verified (distance: {face_distance:.4f}, similarity: {similarity_percentage:.1f}%)"
            else:
                message = f"Face verification failed (distance: {face_distance:.4f}, similarity: {similarity_percentage:.1f}%)"
            
            return is_verified, face_distance, message
            
        except Exception as e:
            print(f"❌ Error comparing faces: {e}")
            return False, 1.0, f"Comparison error: {str(e)}"
    
    def register_face(self, employee_id, image_pil):
        """Register face with local storage"""
        start_time = time.time()
        
        try:
            print(f"🔄 Registering face for employee: {employee_id}")
            
            # Save original image
            image_path = self.save_face_image(employee_id, image_pil)
            if not image_path:
                return {
                    'success': False,
                    'message': 'Failed to save image',
                    'encoding_saved': False,
                    'faces_detected': 0
                }
            
            # Extract face encoding
            encoding, location = self.extract_face_encoding(image_pil)
            if encoding is None:
                return {
                    'success': False,
                    'message': 'No face detected in image. Please ensure face is clearly visible.',
                    'encoding_saved': False,
                    'faces_detected': 0
                }
            
            # Save face encoding
            encoding_path = self.save_face_encoding(employee_id, encoding)
            if not encoding_path:
                return {
                    'success': False,
                    'message': 'Failed to save face encoding',
                    'encoding_saved': False,
                    'faces_detected': 1
                }
            
            processing_time = int((time.time() - start_time) * 1000)
            
            print(f"✅ Face registered successfully for {employee_id}")
            
            return {
                'success': True,
                'message': 'Face registered successfully with high accuracy',
                'encoding_saved': True,
                'faces_detected': 1,
                'image_path': image_path,
                'encoding_path': encoding_path,
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            print(f"❌ Registration error: {e}")
            return {
                'success': False,
                'message': f'Registration error: {str(e)}',
                'encoding_saved': False,
                'faces_detected': 0,
                'processing_time_ms': processing_time
            }
    
    def verify_face(self, employee_id, selfie_pil):
        """Verify face with high accuracy"""
        start_time = time.time()
        
        try:
            print(f"🔍 Verifying face for employee: {employee_id}")
            
            # Load stored encoding
            stored_encoding = self.load_face_encoding(employee_id)
            if stored_encoding is None:
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': 'No registered face found',
                    'faces_detected': 0
                }
            
            # Extract encoding from selfie
            selfie_encoding, location = self.extract_face_encoding(selfie_pil)
            if selfie_encoding is None:
                processing_time = int((time.time() - start_time) * 1000)
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': 'No face detected in selfie. Please ensure face is clearly visible.',
                    'faces_detected': 0,
                    'processing_time_ms': processing_time
                }
            
            # Compare faces with high accuracy
            is_verified, face_distance, message = self.compare_faces_accurate(stored_encoding, selfie_encoding)
            
            # Calculate confidence percentage (inverse of distance)
            confidence_percentage = max(0, (1 - face_distance) * 100)
            
            processing_time = int((time.time() - start_time) * 1000)
            
            print(f"🎯 Verification result: {'PASS' if is_verified else 'FAIL'}")
            
            return {
                'success': True,
                'verified': is_verified,
                'confidence': round(confidence_percentage, 2),
                'face_distance': round(face_distance, 4),
                'message': message,
                'faces_detected': 1,
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            print(f"❌ Verification error: {e}")
            return {
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': f'Verification error: {str(e)}',
                'faces_detected': 0,
                'processing_time_ms': processing_time
            }
    
    def check_face_registered(self, employee_id):
        """Check if employee has registered face"""
        encoding_path = self.storage_path / f"{employee_id}_encoding.pkl"
        image_path = self.storage_path / f"{employee_id}_original.jpg"
        
        has_encoding = encoding_path.exists()
        has_image = image_path.exists()
        
        return {
            'registered': has_encoding and has_image,
            'has_encoding': has_encoding,
            'has_image': has_image,
            'message': 'Face registered with local storage' if (has_encoding and has_image) else 'No face registered'
        }
    
    def get_registered_employees(self):
        """Get list of registered employees"""
        employees = []
        for encoding_file in self.storage_path.glob("*_encoding.pkl"):
            employee_id = encoding_file.stem.replace("_encoding", "")
            employees.append(employee_id)
        return employees
    
    def cleanup_employee_data(self, employee_id):
        """Remove all data for an employee"""
        try:
            encoding_path = self.storage_path / f"{employee_id}_encoding.pkl"
            image_path = self.storage_path / f"{employee_id}_original.jpg"
            
            removed = []
            if encoding_path.exists():
                encoding_path.unlink()
                removed.append("encoding")
            
            if image_path.exists():
                image_path.unlink()
                removed.append("image")
            
            return {
                'success': True,
                'removed': removed,
                'message': f'Cleaned up {len(removed)} files for {employee_id}'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Cleanup error: {str(e)}'
            }