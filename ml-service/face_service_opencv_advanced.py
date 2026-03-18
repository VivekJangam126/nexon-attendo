"""
Advanced OpenCV Face Recognition Service
Uses only OpenCV (already installed) with improved algorithms
"""
import cv2
import numpy as np
import os
import time
from PIL import Image
import pickle
from pathlib import Path
import hashlib

class AdvancedOpenCVFaceService:
    """
    Advanced face recognition using only OpenCV with multiple detection methods
    """
    
    def __init__(self):
        self.confidence_threshold = 0.80  # Increased to 80% for much stricter verification
        self.storage_path = Path("face_storage")
        self.storage_path.mkdir(exist_ok=True)
        
        print(f"🔧 Initializing Advanced OpenCV Face Recognition...")
        print(f"📁 Storage path: {self.storage_path.absolute()}")
        
        # Load multiple face detection cascades
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.face_cascade_alt = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt.xml')
        self.profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        
        # Note: LBPH Face Recognizer requires opencv-contrib-python
        # We'll use our own advanced feature extraction instead
        
        print(f"✅ Advanced OpenCV face recognition initialized")
        print(f"🎯 Using custom feature extraction (no LBPH dependency)")
    
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
    
    def detect_faces_multiple_methods(self, image_array):
        """Detect faces using multiple cascade classifiers"""
        try:
            gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
            
            # Method 1: Default frontal face cascade
            faces1 = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(50, 50)
            )
            
            # Method 2: Alternative frontal face cascade
            faces2 = self.face_cascade_alt.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40)
            )
            
            # Method 3: Profile face cascade
            faces3 = self.profile_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40)
            )
            
            # Combine all detections
            all_faces = []
            if len(faces1) > 0:
                all_faces.extend(faces1)
            if len(faces2) > 0:
                all_faces.extend(faces2)
            if len(faces3) > 0:
                all_faces.extend(faces3)
            
            if len(all_faces) == 0:
                return None, 0.0
            
            # Find the largest face (most likely to be the main subject)
            largest_face = max(all_faces, key=lambda x: x[2] * x[3])
            x, y, w, h = largest_face
            
            # Extract face region with padding
            padding = 20
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(gray.shape[1], x + w + padding)
            y2 = min(gray.shape[0], y + h + padding)
            
            face_region = gray[y1:y2, x1:x2]
            
            # Calculate confidence based on face size
            face_area = w * h
            image_area = gray.shape[0] * gray.shape[1]
            confidence = min(1.0, face_area / (image_area * 0.1))  # Face should be at least 10% of image
            
            return face_region, confidence
            
        except Exception as e:
            print(f"❌ Error in face detection: {e}")
            return None, 0.0
    
    def extract_advanced_features(self, face_region):
        """Extract advanced features from face region with more discriminative power"""
        try:
            if face_region is None or face_region.size == 0:
                return None
            
            # Resize to standard size
            face_resized = cv2.resize(face_region, (128, 128))
            
            # Apply histogram equalization for better consistency
            face_equalized = cv2.equalizeHist(face_resized)
            
            features = []
            
            # Feature 1: More detailed regional analysis (16 regions instead of 9)
            h, w = face_equalized.shape
            regions = []
            for i in range(4):  # 4x4 grid = 16 regions
                for j in range(4):
                    y1, y2 = i * h // 4, (i + 1) * h // 4
                    x1, x2 = j * w // 4, (j + 1) * w // 4
                    region = face_equalized[y1:y2, x1:x2]
                    if region.size > 0:
                        # More detailed histogram (32 bins instead of 16)
                        hist_region = cv2.calcHist([region], [0], None, [32], [0, 256])
                        features.extend(hist_region.flatten())
                        
                        # Statistical features for each region
                        features.append(np.mean(region))
                        features.append(np.std(region))
                        features.append(np.median(region))
                        features.append(np.percentile(region, 25))  # 25th percentile
                        features.append(np.percentile(region, 75))  # 75th percentile
            
            # Feature 2: Enhanced LBP features with multiple radii
            lbp_features_1 = self.extract_lbp_features_enhanced(face_equalized, radius=1, neighbors=8)
            if lbp_features_1 is not None:
                features.extend(lbp_features_1)
            
            lbp_features_2 = self.extract_lbp_features_enhanced(face_equalized, radius=2, neighbors=16)
            if lbp_features_2 is not None:
                features.extend(lbp_features_2)
            
            # Feature 3: Gradient features (more discriminative)
            grad_x = cv2.Sobel(face_equalized, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(face_equalized, cv2.CV_64F, 0, 1, ksize=3)
            gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
            
            # Gradient histogram
            grad_hist = cv2.calcHist([gradient_magnitude.astype(np.uint8)], [0], None, [32], [0, 256])
            features.extend(grad_hist.flatten())
            
            # Feature 4: Texture analysis using Gabor-like filters
            texture_features = self.extract_texture_features(face_equalized)
            if texture_features is not None:
                features.extend(texture_features)
            
            return np.array(features, dtype=np.float32)
            
        except Exception as e:
            print(f"❌ Error extracting features: {e}")
            return None
    
    def extract_lbp_features_enhanced(self, image, radius=1, neighbors=8):
        """Extract enhanced Local Binary Pattern features with configurable parameters"""
        try:
            lbp = np.zeros_like(image, dtype=np.uint8)
            
            for i in range(radius, image.shape[0] - radius):
                for j in range(radius, image.shape[1] - radius):
                    center = image[i, j]
                    binary_string = ''
                    
                    # Sample neighbors in a circle
                    for n in range(neighbors):
                        angle = 2 * np.pi * n / neighbors
                        x = int(i + radius * np.cos(angle))
                        y = int(j + radius * np.sin(angle))
                        
                        # Ensure coordinates are within bounds
                        x = max(0, min(image.shape[0] - 1, x))
                        y = max(0, min(image.shape[1] - 1, y))
                        
                        binary_string += '1' if image[x, y] >= center else '0'
                    
                    lbp[i, j] = int(binary_string, 2) if len(binary_string) > 0 else 0
            
            # Calculate LBP histogram with more bins for better discrimination
            lbp_hist = cv2.calcHist([lbp], [0], None, [64], [0, 256])
            return lbp_hist.flatten()
            
        except Exception as e:
            print(f"❌ Error in enhanced LBP extraction: {e}")
            return None

    def extract_texture_features(self, image):
        """Extract texture features using simple filter responses"""
        try:
            features = []
            
            # Apply different kernels to capture texture patterns
            kernels = [
                np.array([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]),  # Laplacian
                np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]),       # Sobel X
                np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]]),       # Sobel Y
                np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]),      # Sharpening
            ]
            
            for kernel in kernels:
                filtered = cv2.filter2D(image, -1, kernel)
                # Statistical features of filtered response
                features.append(np.mean(filtered))
                features.append(np.std(filtered))
                features.append(np.var(filtered))
            
            return np.array(features, dtype=np.float32)
            
        except Exception as e:
            print(f"❌ Error in texture feature extraction: {e}")
            return None

    def save_face_features(self, employee_id, features):
        """Save face features to local file"""
        try:
            features_path = self.storage_path / f"{employee_id}_features.pkl"
            with open(features_path, 'wb') as f:
                pickle.dump(features, f)
            print(f"💾 Saved features: {features_path}")
            return True
        except Exception as e:
            print(f"❌ Error saving features: {e}")
            return False

    def load_face_features(self, employee_id):
        """Load face features from local file"""
        try:
            features_path = self.storage_path / f"{employee_id}_features.pkl"
            if not features_path.exists():
                print(f"❌ No features file found: {features_path}")
                print(f"📁 Available files in storage:")
                if self.storage_path.exists():
                    for file in self.storage_path.iterdir():
                        print(f"   - {file.name}")
                else:
                    print(f"   - Storage directory doesn't exist: {self.storage_path}")
                return None
            
            with open(features_path, 'rb') as f:
                features = pickle.load(f)
            print(f"✅ Loaded features: {features_path}")
            return features
        except Exception as e:
            print(f"❌ Error loading features: {e}")
            return None

    def compare_faces_advanced(self, features1, features2):
        """Advanced face comparison using multiple similarity metrics"""
        try:
            if features1 is None or features2 is None:
                return 0.0
            
            # Ensure features are numpy arrays
            features1 = np.array(features1, dtype=np.float32)
            features2 = np.array(features2, dtype=np.float32)
            
            # Check if features are valid
            if len(features1) == 0 or len(features2) == 0:
                return 0.0
            
            # Normalize features to prevent overflow
            features1 = features1 / (np.linalg.norm(features1) + 1e-8)
            features2 = features2 / (np.linalg.norm(features2) + 1e-8)
            
            similarities = []
            
            # 1. Cosine similarity (most reliable for face comparison)
            cosine_sim = np.dot(features1, features2)
            cosine_sim = max(0.0, min(1.0, float(cosine_sim)))  # Clamp to [0,1]
            similarities.append(cosine_sim)
            
            # 2. Euclidean distance (inverted and normalized)
            euclidean_dist = np.linalg.norm(features1 - features2)
            # More strict euclidean similarity calculation
            euclidean_sim = 1.0 / (1.0 + euclidean_dist * 2.0)  # More penalty for distance
            euclidean_sim = max(0.0, min(1.0, float(euclidean_sim)))
            similarities.append(euclidean_sim)
            
            # 3. Manhattan distance (L1 norm) - more strict
            manhattan_dist = np.sum(np.abs(features1 - features2))
            manhattan_sim = 1.0 / (1.0 + manhattan_dist * 3.0)  # Even more penalty
            manhattan_sim = max(0.0, min(1.0, float(manhattan_sim)))
            similarities.append(manhattan_sim)
            
            # 4. Correlation coefficient (if valid)
            try:
                correlation = np.corrcoef(features1, features2)[0, 1]
                if not np.isnan(correlation) and not np.isinf(correlation):
                    correlation = abs(float(correlation))
                    correlation = max(0.0, min(1.0, correlation))
                    similarities.append(correlation)
            except:
                pass  # Skip correlation if it fails
            
            # Weighted average with emphasis on stricter metrics
            if len(similarities) >= 4:
                # All metrics available - prioritize stricter ones
                weights = [0.3, 0.3, 0.3, 0.1]  # Less weight on correlation
            elif len(similarities) == 3:
                weights = [0.4, 0.3, 0.3]  # Balanced
            elif len(similarities) == 2:
                weights = [0.6, 0.4]  # Favor cosine
            else:
                weights = [1.0]  # Only one metric
            
            final_similarity = sum(w * s for w, s in zip(weights, similarities))
            
            # Apply additional strictness - reduce similarity for safety
            final_similarity = final_similarity * 0.8  # 20% penalty for safety
            
            print(f"🔍 Similarity metrics: {len(similarities)} available")
            print(f"🔍 Raw similarities: {[f'{s:.3f}' for s in similarities]}")
            print(f"🎯 Final similarity (with penalty): {final_similarity:.3f}")
            
            return float(final_similarity)
            
        except Exception as e:
            print(f"❌ Error in face comparison: {e}")
            return 0.0

    def register_face(self, employee_id, image_pil):
        """Register a face for an employee"""
        try:
            print(f"🔄 Registering face for employee: {employee_id}")
            
            # Convert PIL to OpenCV format
            image_array = np.array(image_pil)
            if len(image_array.shape) == 3:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
            # Save original image
            image_path = self.save_face_image(employee_id, image_pil)
            if not image_path:
                return {
                    'success': False,
                    'message': 'Failed to save image',
                    'encoding_saved': False,
                    'faces_detected': 0
                }
            
            # Detect face and extract features
            face_region, detection_confidence = self.detect_faces_multiple_methods(image_array)
            
            if face_region is None:
                return {
                    'success': False,
                    'message': 'No face detected in the image',
                    'encoding_saved': False,
                    'faces_detected': 0
                }
            
            # Extract advanced features
            features = self.extract_advanced_features(face_region)
            if features is None:
                return {
                    'success': False,
                    'message': 'Failed to extract face features',
                    'encoding_saved': False,
                    'faces_detected': 1
                }
            
            # Save features
            if not self.save_face_features(employee_id, features):
                return {
                    'success': False,
                    'message': 'Failed to save face features',
                    'encoding_saved': False,
                    'faces_detected': 1
                }
            
            print(f"✅ Face registered successfully for {employee_id}")
            return {
                'success': True,
                'message': 'Face registered successfully',
                'encoding_saved': True,
                'faces_detected': 1,
                'detection_confidence': detection_confidence
            }
            
        except Exception as e:
            print(f"❌ Error in face registration: {e}")
            return {
                'success': False,
                'message': f'Registration failed: {str(e)}',
                'encoding_saved': False,
                'faces_detected': 0
            }

    def verify_face(self, employee_id, selfie_pil):
        """Verify a face against registered face"""
        try:
            print(f"🔍 Verifying face for employee: {employee_id}")
            
            # Load registered features
            registered_features = self.load_face_features(employee_id)
            if registered_features is None:
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': f'No registered face found for {employee_id}',
                    'faces_detected': 0
                }
            
            # Convert PIL to OpenCV format
            selfie_array = np.array(selfie_pil)
            if len(selfie_array.shape) == 3:
                selfie_array = cv2.cvtColor(selfie_array, cv2.COLOR_RGB2BGR)
            
            # Detect face in selfie
            face_region, detection_confidence = self.detect_faces_multiple_methods(selfie_array)
            
            if face_region is None:
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': 'No face detected in selfie',
                    'faces_detected': 0
                }
            
            # Extract features from selfie
            selfie_features = self.extract_advanced_features(face_region)
            if selfie_features is None:
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': 'Failed to extract features from selfie',
                    'faces_detected': 1
                }
            
            # Compare features
            similarity = self.compare_faces_advanced(registered_features, selfie_features)
            
            # Convert similarity to percentage
            confidence_percentage = similarity * 100
            
            # Determine if verification passed
            is_verified = bool(similarity >= self.confidence_threshold)
            
            message = f"Face {'verified' if is_verified else 'not verified'} (confidence: {confidence_percentage:.1f}%)"
            
            print(f"🎯 Verification result: {message}")
            
            return {
                'success': True,
                'verified': is_verified,
                'confidence': float(confidence_percentage),
                'message': message,
                'faces_detected': 1,
                'similarity_score': float(similarity)
            }
            
        except Exception as e:
            print(f"❌ Error in face verification: {e}")
            return {
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': f'Verification failed: {str(e)}',
                'faces_detected': 0
            }