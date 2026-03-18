"""
Windows-Compatible Accurate Face Recognition Service
Using MediaPipe for face detection and custom feature extraction
"""
import cv2
import numpy as np
import os
import time
from PIL import Image
import pickle
from pathlib import Path
import mediapipe as mp
from sklearn.metrics.pairwise import cosine_similarity
import hashlib

class MediaPipeFaceService:
    """
    Accurate face recognition using MediaPipe (Windows compatible)
    """
    
    def __init__(self):
        self.confidence_threshold = 0.75  # Cosine similarity threshold
        self.storage_path = Path("face_storage")
        self.storage_path.mkdir(exist_ok=True)
        
        print(f"🔧 Initializing MediaPipe Face Recognition...")
        print(f"📁 Storage path: {self.storage_path.absolute()}")
        
        # Initialize MediaPipe Face Detection
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_drawing = mp.solutions.drawing_utils
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=1,  # 1 for better accuracy, 0 for speed
            min_detection_confidence=0.7
        )
        
        # Initialize MediaPipe Face Mesh for landmarks
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        print(f"✅ MediaPipe face recognition initialized successfully")
    
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
    
    def detect_face_mediapipe(self, image_array):
        """Detect face using MediaPipe"""
        try:
            # Convert BGR to RGB for MediaPipe
            rgb_image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            results = self.face_detection.process(rgb_image)
            
            if not results.detections:
                return None, None
            
            # Get the first (most confident) detection
            detection = results.detections[0]
            
            # Get bounding box
            bbox = detection.location_data.relative_bounding_box
            h, w, _ = image_array.shape
            
            # Convert relative coordinates to absolute
            x = int(bbox.xmin * w)
            y = int(bbox.ymin * h)
            width = int(bbox.width * w)
            height = int(bbox.height * h)
            
            # Ensure coordinates are within image bounds
            x = max(0, x)
            y = max(0, y)
            width = min(width, w - x)
            height = min(height, h - y)
            
            # Extract face region
            face_region = image_array[y:y+height, x:x+width]
            
            confidence = detection.score[0]
            
            return face_region, confidence
            
        except Exception as e:
            print(f"❌ Error in MediaPipe face detection: {e}")
            return None, None
    
    def extract_face_landmarks(self, image_array):
        """Extract face landmarks using MediaPipe Face Mesh"""
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
            
            # Process with face mesh
            results = self.face_mesh.process(rgb_image)
            
            if not results.multi_face_landmarks:
                return None
            
            # Get landmarks for the first face
            face_landmarks = results.multi_face_landmarks[0]
            
            # Extract key landmark points (468 total landmarks)
            landmarks = []
            for landmark in face_landmarks.landmark:
                landmarks.extend([landmark.x, landmark.y, landmark.z])
            
            return np.array(landmarks)
            
        except Exception as e:
            print(f"❌ Error extracting landmarks: {e}")
            return None
    
    def extract_face_features(self, image_pil):
        """Extract comprehensive face features"""
        try:
            # Convert PIL to OpenCV format
            image_array = np.array(image_pil)
            if len(image_array.shape) == 3:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
            # Method 1: Face detection and cropping
            face_region, detection_confidence = self.detect_face_mediapipe(image_array)
            
            if face_region is None:
                print("❌ No face detected with MediaPipe")
                return None, 0.0
            
            print(f"✅ Face detected with confidence: {detection_confidence:.3f}")
            
            # Method 2: Extract face landmarks
            landmarks = self.extract_face_landmarks(image_array)
            
            # Method 3: Extract visual features from face region
            face_gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            face_resized = cv2.resize(face_gray, (128, 128))
            
            # Histogram features
            hist = cv2.calcHist([face_resized], [0], None, [64], [0, 256])
            hist_features = hist.flatten() / (hist.sum() + 1e-7)
            
            # Texture features (LBP-like)
            texture_features = []
            for i in range(0, 128, 16):
                for j in range(0, 128, 16):
                    region = face_resized[i:i+16, j:j+16]
                    if region.size > 0:
                        texture_features.append(np.mean(region))
                        texture_features.append(np.std(region))
            
            # Combine all features
            combined_features = []
            combined_features.extend(hist_features)
            combined_features.extend(texture_features)
            
            if landmarks is not None:
                # Normalize landmarks and add to features
                landmarks_normalized = landmarks / np.max(np.abs(landmarks))
                combined_features.extend(landmarks_normalized[:200])  # Use first 200 landmark features
            
            feature_vector = np.array(combined_features)
            
            print(f"✅ Extracted {len(feature_vector)} features")
            
            return feature_vector, detection_confidence
            
        except Exception as e:
            print(f"❌ Error extracting features: {e}")
            return None, 0.0
    
    def save_face_features(self, employee_id, features):
        """Save face features to file"""
        try:
            features_path = self.storage_path / f"{employee_id}_features.pkl"
            with open(features_path, 'wb') as f:
                pickle.dump(features, f)
            print(f"💾 Saved face features: {features_path}")
            return str(features_path)
        except Exception as e:
            print(f"❌ Error saving features: {e}")
            return None
    
    def load_face_features(self, employee_id):
        """Load face features from file"""
        try:
            features_path = self.storage_path / f"{employee_id}_features.pkl"
            if not features_path.exists():
                return None
            
            with open(features_path, 'rb') as f:
                features = pickle.load(f)
            print(f"📂 Loaded face features: {features_path}")
            return features
        except Exception as e:
            print(f"❌ Error loading features: {e}")
            return None
    
    def compare_faces_advanced(self, features1, features2):
        """Advanced face comparison using multiple methods"""
        try:
            if features1 is None or features2 is None:
                return False, 0.0, "Missing features"
            
            # Ensure features are numpy arrays
            f1 = np.array(features1).reshape(1, -1)
            f2 = np.array(features2).reshape(1, -1)
            
            # Method 1: Cosine similarity
            cosine_sim = cosine_similarity(f1, f2)[0][0]
            
            # Method 2: Euclidean distance (normalized)
            euclidean_dist = np.linalg.norm(f1 - f2)
            max_dist = np.sqrt(len(f1[0]))
            euclidean_sim = 1 - (euclidean_dist / max_dist)
            
            # Method 3: Correlation coefficient
            correlation = np.corrcoef(f1[0], f2[0])[0, 1]
            if np.isnan(correlation):
                correlation = 0
            
            # Weighted combination
            final_similarity = (cosine_sim * 0.5 + euclidean_sim * 0.3 + correlation * 0.2)
            
            # Determine if verified
            is_verified = final_similarity >= self.confidence_threshold
            
            print(f"📊 Face comparison results:")
            print(f"   - Cosine similarity: {cosine_sim:.4f}")
            print(f"   - Euclidean similarity: {euclidean_sim:.4f}")
            print(f"   - Correlation: {correlation:.4f}")
            print(f"   - Final similarity: {final_similarity:.4f}")
            print(f"   - Threshold: {self.confidence_threshold}")
            print(f"   - Verified: {is_verified}")
            
            if is_verified:
                message = f"Face verified (similarity: {final_similarity:.4f})"
            else:
                message = f"Face verification failed (similarity: {final_similarity:.4f}, required: {self.confidence_threshold})"
            
            return is_verified, final_similarity, message
            
        except Exception as e:
            print(f"❌ Error comparing faces: {e}")
            return False, 0.0, f"Comparison error: {str(e)}"
    
    def register_face(self, employee_id, image_pil):
        """Register face with MediaPipe"""
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
            
            # Extract face features
            features, detection_confidence = self.extract_face_features(image_pil)
            if features is None:
                return {
                    'success': False,
                    'message': 'No face detected in image. Please ensure face is clearly visible and well-lit.',
                    'encoding_saved': False,
                    'faces_detected': 0
                }
            
            # Save face features
            features_path = self.save_face_features(employee_id, features)
            if not features_path:
                return {
                    'success': False,
                    'message': 'Failed to save face features',
                    'encoding_saved': False,
                    'faces_detected': 1
                }
            
            processing_time = int((time.time() - start_time) * 1000)
            
            print(f"✅ Face registered successfully for {employee_id}")
            
            return {
                'success': True,
                'message': 'Face registered successfully with MediaPipe',
                'encoding_saved': True,
                'faces_detected': 1,
                'detection_confidence': detection_confidence,
                'feature_dimensions': len(features),
                'image_path': image_path,
                'features_path': features_path,
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
        """Verify face with MediaPipe"""
        start_time = time.time()
        
        try:
            print(f"🔍 Verifying face for employee: {employee_id}")
            
            # Load stored features
            stored_features = self.load_face_features(employee_id)
            if stored_features is None:
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': 'No registered face found',
                    'faces_detected': 0
                }
            
            # Extract features from selfie
            selfie_features, detection_confidence = self.extract_face_features(selfie_pil)
            if selfie_features is None:
                processing_time = int((time.time() - start_time) * 1000)
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': 'No face detected in selfie. Please ensure face is clearly visible.',
                    'faces_detected': 0,
                    'processing_time_ms': processing_time
                }
            
            # Compare faces
            is_verified, similarity, message = self.compare_faces_advanced(stored_features, selfie_features)
            
            # Convert similarity to percentage
            confidence_percentage = similarity * 100
            
            processing_time = int((time.time() - start_time) * 1000)
            
            print(f"🎯 Verification result: {'PASS' if is_verified else 'FAIL'}")
            
            return {
                'success': True,
                'verified': is_verified,
                'confidence': round(confidence_percentage, 2),
                'similarity_score': round(similarity, 4),
                'message': message,
                'faces_detected': 1,
                'detection_confidence': detection_confidence,
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
        features_path = self.storage_path / f"{employee_id}_features.pkl"
        image_path = self.storage_path / f"{employee_id}_original.jpg"
        
        has_features = features_path.exists()
        has_image = image_path.exists()
        
        return {
            'registered': has_features and has_image,
            'has_features': has_features,
            'has_image': has_image,
            'message': 'Face registered with MediaPipe' if (has_features and has_image) else 'No face registered'
        }
    
    def get_registered_employees(self):
        """Get list of registered employees"""
        employees = []
        for features_file in self.storage_path.glob("*_features.pkl"):
            employee_id = features_file.stem.replace("_features", "")
            employees.append(employee_id)
        return employees
    
    def cleanup_employee_data(self, employee_id):
        """Remove all data for an employee"""
        try:
            features_path = self.storage_path / f"{employee_id}_features.pkl"
            image_path = self.storage_path / f"{employee_id}_original.jpg"
            
            removed = []
            if features_path.exists():
                features_path.unlink()
                removed.append("features")
            
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