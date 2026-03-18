"""
Ultra Strict Face Recognition Service
Designed to distinguish between similar-looking people with very high accuracy
"""
import cv2
import numpy as np
import os
import time
from PIL import Image
import pickle
from pathlib import Path
import hashlib

class UltraStrictFaceService:
    """
    Ultra strict face recognition that can distinguish between similar-looking people
    """
    
    def __init__(self):
        self.confidence_threshold = 0.70  # Reduced from 0.85 to 0.70 for better balance
        self.storage_path = Path("face_storage")
        self.storage_path.mkdir(exist_ok=True)
        
        print(f"🔧 Initializing Ultra Strict Face Recognition...")
        print(f"📁 Storage path: {self.storage_path.absolute()}")
        print(f"🎯 Ultra strict threshold: {self.confidence_threshold * 100}%")
        
        # Load multiple face detection cascades
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.face_cascade_alt = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt.xml')
        self.profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        
        print(f"✅ Ultra strict face recognition initialized")
    
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
                gray, scaleFactor=1.05, minNeighbors=6, minSize=(60, 60)
            )
            
            # Method 2: Alternative frontal face cascade
            faces2 = self.face_cascade_alt.detectMultiScale(
                gray, scaleFactor=1.05, minNeighbors=5, minSize=(50, 50)
            )
            
            # Combine detections
            all_faces = []
            if len(faces1) > 0:
                all_faces.extend(faces1)
            if len(faces2) > 0:
                all_faces.extend(faces2)
            
            if len(all_faces) == 0:
                return None, 0.0
            
            # Find the largest face
            largest_face = max(all_faces, key=lambda x: x[2] * x[3])
            x, y, w, h = largest_face
            
            # Extract face region with minimal padding
            padding = 10
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(gray.shape[1], x + w + padding)
            y2 = min(gray.shape[0], y + h + padding)
            
            face_region = gray[y1:y2, x1:x2]
            
            # Calculate confidence based on face size and quality
            face_area = w * h
            image_area = gray.shape[0] * gray.shape[1]
            confidence = min(1.0, face_area / (image_area * 0.05))
            
            return face_region, confidence
            
        except Exception as e:
            print(f"❌ Error in face detection: {e}")
            return None, 0.0
    
    def extract_ultra_discriminative_features(self, face_region):
        """Extract ultra discriminative features for distinguishing similar faces"""
        try:
            if face_region is None or face_region.size == 0:
                return None
            
            # Resize to larger standard size for more detail
            face_resized = cv2.resize(face_region, (160, 160))
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            face_enhanced = clahe.apply(face_resized)
            
            features = []
            
            # Feature Set 1: Ultra-detailed regional analysis (6x6 = 36 regions)
            h, w = face_enhanced.shape
            for i in range(6):
                for j in range(6):
                    y1, y2 = i * h // 6, (i + 1) * h // 6
                    x1, x2 = j * w // 6, (j + 1) * w // 6
                    region = face_enhanced[y1:y2, x1:x2]
                    
                    if region.size > 0:
                        # Detailed histogram (64 bins)
                        hist = cv2.calcHist([region], [0], None, [64], [0, 256])
                        features.extend(hist.flatten())
                        
                        # Statistical moments
                        features.append(np.mean(region))
                        features.append(np.std(region))
                        features.append(np.var(region))
                        features.append(np.percentile(region, 10))
                        features.append(np.percentile(region, 25))
                        features.append(np.percentile(region, 75))
                        features.append(np.percentile(region, 90))
            
            # Feature Set 2: Multi-scale LBP features
            for radius in [1, 2, 3]:
                for neighbors in [8, 16]:
                    lbp_features = self.extract_lbp_multiscale(face_enhanced, radius, neighbors)
                    if lbp_features is not None:
                        features.extend(lbp_features)
            
            # Feature Set 3: Gradient orientation histograms (HOG-like)
            grad_x = cv2.Sobel(face_enhanced, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(face_enhanced, cv2.CV_64F, 0, 1, ksize=3)
            
            magnitude = np.sqrt(grad_x**2 + grad_y**2)
            orientation = np.arctan2(grad_y, grad_x)
            
            # Orientation histogram
            orientation_hist, _ = np.histogram(orientation.flatten(), bins=36, range=(-np.pi, np.pi))
            features.extend(orientation_hist.astype(np.float32))
            
            # Feature Set 4: Texture analysis with multiple filters
            texture_features = self.extract_advanced_texture(face_enhanced)
            if texture_features is not None:
                features.extend(texture_features)
            
            # Feature Set 5: Frequency domain features (DCT coefficients)
            dct_features = self.extract_dct_features(face_enhanced)
            if dct_features is not None:
                features.extend(dct_features)
            
            print(f"🔢 Extracted {len(features)} ultra-discriminative features")
            return np.array(features, dtype=np.float32)
            
        except Exception as e:
            print(f"❌ Error extracting ultra features: {e}")
            return None
    
    def extract_lbp_multiscale(self, image, radius, neighbors):
        """Extract multi-scale LBP features"""
        try:
            lbp = np.zeros_like(image, dtype=np.uint8)
            
            for i in range(radius, image.shape[0] - radius):
                for j in range(radius, image.shape[1] - radius):
                    center = image[i, j]
                    binary_string = ''
                    
                    for n in range(neighbors):
                        angle = 2 * np.pi * n / neighbors
                        x = int(i + radius * np.cos(angle))
                        y = int(j + radius * np.sin(angle))
                        
                        x = max(0, min(image.shape[0] - 1, x))
                        y = max(0, min(image.shape[1] - 1, y))
                        
                        binary_string += '1' if image[x, y] >= center else '0'
                    
                    lbp[i, j] = int(binary_string, 2) if len(binary_string) > 0 else 0
            
            # LBP histogram with many bins for discrimination
            lbp_hist = cv2.calcHist([lbp], [0], None, [128], [0, 256])
            return lbp_hist.flatten()
            
        except Exception as e:
            print(f"❌ Error in multi-scale LBP: {e}")
            return None
    
    def extract_advanced_texture(self, image):
        """Extract advanced texture features"""
        try:
            features = []
            
            # Multiple texture analysis kernels
            kernels = [
                # Edge detection kernels
                np.array([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]),  # Laplacian
                np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]),       # Sobel X
                np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]]),       # Sobel Y
                # Texture kernels
                np.array([[1, 2, 1], [0, 0, 0], [-1, -2, -1]]),       # Horizontal edge
                np.array([[1, 0, -1], [2, 0, -2], [1, 0, -1]]),       # Vertical edge
                np.array([[0, -1, 0], [-1, 4, -1], [0, -1, 0]]),      # Cross
            ]
            
            for kernel in kernels:
                filtered = cv2.filter2D(image, -1, kernel)
                
                # Statistical features of filtered response
                features.extend([
                    np.mean(filtered),
                    np.std(filtered),
                    np.var(filtered),
                    np.min(filtered),
                    np.max(filtered),
                    np.percentile(filtered, 25),
                    np.percentile(filtered, 75)
                ])
            
            return np.array(features, dtype=np.float32)
            
        except Exception as e:
            print(f"❌ Error in texture extraction: {e}")
            return None
    
    def extract_dct_features(self, image):
        """Extract DCT (Discrete Cosine Transform) features"""
        try:
            # Apply DCT to the image
            dct = cv2.dct(np.float32(image))
            
            # Take only low-frequency coefficients (top-left 32x32)
            dct_low_freq = dct[:32, :32]
            
            # Flatten and normalize
            dct_features = dct_low_freq.flatten()
            dct_features = dct_features / (np.linalg.norm(dct_features) + 1e-8)
            
            return dct_features
            
        except Exception as e:
            print(f"❌ Error in DCT extraction: {e}")
            return None
    
    def save_face_features(self, employee_id, features):
        """Save face features to local file"""
        try:
            features_path = self.storage_path / f"{employee_id}_features.pkl"
            with open(features_path, 'wb') as f:
                pickle.dump(features, f)
            print(f"💾 Saved ultra features: {features_path}")
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
                return None
            
            with open(features_path, 'rb') as f:
                features = pickle.load(f)
            print(f"✅ Loaded ultra features: {features_path}")
            return features
        except Exception as e:
            print(f"❌ Error loading features: {e}")
            return None

    def compare_faces_ultra_strict(self, features1, features2):
        """Balanced strict face comparison - strict but not impossible"""
        try:
            if features1 is None or features2 is None:
                return 0.0
            
            features1 = np.array(features1, dtype=np.float32)
            features2 = np.array(features2, dtype=np.float32)
            
            if len(features1) == 0 or len(features2) == 0:
                return 0.0
            
            # Normalize features
            features1 = features1 / (np.linalg.norm(features1) + 1e-8)
            features2 = features2 / (np.linalg.norm(features2) + 1e-8)
            
            similarities = []
            
            # 1. Cosine similarity (primary metric - most reliable)
            cosine_sim = np.dot(features1, features2)
            cosine_sim = max(0.0, min(1.0, float(cosine_sim)))
            similarities.append(cosine_sim)
            
            # 2. Euclidean distance (less strict penalty)
            euclidean_dist = np.linalg.norm(features1 - features2)
            euclidean_sim = 1.0 / (1.0 + euclidean_dist * 3.0)  # Reduced from 10.0 to 3.0
            euclidean_sim = max(0.0, min(1.0, float(euclidean_sim)))
            similarities.append(euclidean_sim)
            
            # 3. Pearson correlation
            try:
                correlation = np.corrcoef(features1, features2)[0, 1]
                if not np.isnan(correlation) and not np.isinf(correlation):
                    correlation = abs(float(correlation))
                    similarities.append(correlation)
                else:
                    similarities.append(0.0)
            except:
                similarities.append(0.0)
            
            # 4. Structural similarity (less strict)
            structural_sim = self.calculate_structural_similarity_balanced(features1, features2)
            similarities.append(structural_sim)
            
            # Balanced weighted combination - favor reliable metrics
            weights = [0.5, 0.2, 0.2, 0.1]  # Heavy weight on cosine similarity
            final_similarity = sum(w * s for w, s in zip(weights, similarities))
            
            # Apply moderate penalties instead of ultra-strict
            final_similarity = final_similarity * 0.90  # 10% base penalty (was 25%)
            
            # Conditional penalties (less harsh)
            min_similarity = min(similarities)
            if min_similarity < 0.2:  # Only if very low (was 0.4)
                final_similarity = final_similarity * 0.85  # 15% penalty (was 40%)
            
            # Less harsh euclidean penalty
            if similarities[1] < 0.15:  # Only if extremely low (was 0.3)
                final_similarity = final_similarity * 0.80  # 20% penalty (was 50%)
            
            print(f"🔍 Balanced-strict metrics: {len(similarities)} available")
            print(f"🔍 Raw similarities: {[f'{s:.3f}' for s in similarities]}")
            print(f"🔍 Min similarity: {min_similarity:.3f}")
            print(f"🔍 Euclidean sim: {similarities[1]:.3f}")
            print(f"🎯 Final balanced similarity: {final_similarity:.3f}")
            
            return float(final_similarity)
            
        except Exception as e:
            print(f"❌ Error in balanced comparison: {e}")
            return 0.0

    def calculate_structural_similarity_balanced(self, features1, features2):
        """Calculate balanced structural similarity"""
        try:
            chunk_size = len(features1) // 8  # 8 chunks instead of 16
            if chunk_size == 0:
                return 0.0
            
            chunk_similarities = []
            for i in range(0, len(features1), chunk_size):
                chunk1 = features1[i:i+chunk_size]
                chunk2 = features2[i:i+chunk_size]
                
                if len(chunk1) > 0 and len(chunk2) > 0:
                    norm1 = np.linalg.norm(chunk1)
                    norm2 = np.linalg.norm(chunk2)
                    if norm1 > 0 and norm2 > 0:
                        chunk_sim = np.dot(chunk1, chunk2) / (norm1 * norm2)
                        chunk_similarities.append(max(0.0, min(1.0, float(chunk_sim))))
            
            if not chunk_similarities:
                return 0.0
            
            # Return average instead of minimum (less strict)
            return np.mean(chunk_similarities)
            
        except Exception as e:
            print(f"❌ Error in structural similarity: {e}")
            return 0.0

    def register_face(self, employee_id, image_pil):
        """Register a face with ultra-strict features"""
        try:
            print(f"🔄 Ultra-strict registration for: {employee_id}")
            
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
            
            # Detect face
            face_region, detection_confidence = self.detect_faces_multiple_methods(image_array)
            
            if face_region is None:
                return {
                    'success': False,
                    'message': 'No face detected in the image',
                    'encoding_saved': False,
                    'faces_detected': 0
                }
            
            # Extract ultra-discriminative features
            features = self.extract_ultra_discriminative_features(face_region)
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
            
            print(f"✅ Ultra-strict registration successful for {employee_id}")
            return {
                'success': True,
                'message': 'Face registered with ultra-strict features',
                'encoding_saved': True,
                'faces_detected': 1,
                'detection_confidence': detection_confidence
            }
            
        except Exception as e:
            print(f"❌ Error in ultra-strict registration: {e}")
            return {
                'success': False,
                'message': f'Registration failed: {str(e)}',
                'encoding_saved': False,
                'faces_detected': 0
            }

    def verify_face(self, employee_id, selfie_pil):
        """Verify face with ultra-strict comparison"""
        try:
            print(f"🔍 Ultra-strict verification for: {employee_id}")
            
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
            selfie_features = self.extract_ultra_discriminative_features(face_region)
            if selfie_features is None:
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': 'Failed to extract features from selfie',
                    'faces_detected': 1
                }
            
            # Ultra-strict comparison
            similarity = self.compare_faces_ultra_strict(registered_features, selfie_features)
            
            # Convert to percentage
            confidence_percentage = similarity * 100
            
            # Ultra-strict verification
            is_verified = similarity >= self.confidence_threshold
            
            message = f"Face {'verified' if is_verified else 'not verified'} (confidence: {confidence_percentage:.1f}%)"
            
            print(f"🎯 Ultra-strict result: {message}")
            
            return {
                'success': True,
                'verified': is_verified,
                'confidence': confidence_percentage,
                'message': message,
                'faces_detected': 1,
                'similarity_score': similarity
            }
            
        except Exception as e:
            print(f"❌ Error in ultra-strict verification: {e}")
            return {
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': f'Verification failed: {str(e)}',
                'faces_detected': 0
            }