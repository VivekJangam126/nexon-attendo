"""
Burst Mode Face Recognition Service
Handles 50+ photos for maximum accuracy and discrimination
"""
import cv2
import numpy as np
from pathlib import Path
import pickle
import json
from PIL import Image
import time
from typing import List, Dict, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BurstAccurateFaceService:
    def __init__(self, storage_path: str = "face_storage", confidence_threshold: float = 0.85):
        """
        Initialize Burst Mode Face Recognition Service
        
        Args:
            storage_path: Directory to store face data
            confidence_threshold: Minimum confidence for verification (85% for high accuracy)
        """
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)
        self.confidence_threshold = confidence_threshold
        
        # Initialize face detection
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Initialize LBP for texture analysis
        self.lbp_radius = 3
        self.lbp_n_points = 8 * self.lbp_radius
        
        logger.info(f"🚀 Burst Accurate Face Service initialized")
        logger.info(f"📁 Storage: {self.storage_path}")
        logger.info(f"🎯 Confidence threshold: {self.confidence_threshold * 100}%")
        logger.info(f"📸 Designed for 50+ photo burst registration")

    def _detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect faces in image using Haar cascades with lenient settings"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Try multiple detection settings for better results
        faces = []
        
        # First attempt: Standard settings
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=3,  # Reduced from 5 to 3 for more lenient detection
            minSize=(50, 50),  # Reduced from (100,100) to (50,50) for smaller faces
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        # If no faces found, try more lenient settings
        if len(faces) == 0:
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.05,  # More sensitive scale factor
                minNeighbors=2,    # Even more lenient
                minSize=(30, 30),  # Even smaller minimum size
                flags=cv2.CASCADE_SCALE_IMAGE
            )
        
        # If still no faces, try with different cascade
        if len(faces) == 0:
            # Try with profile face cascade as backup
            try:
                profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
                faces = profile_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=3,
                    minSize=(50, 50)
                )
            except:
                pass
        
        logger.info(f"🔍 Face detection: Found {len(faces)} faces in image")
        return faces.tolist()

    def _extract_lbp_features(self, face_region: np.ndarray) -> np.ndarray:
        """Extract Local Binary Pattern features from face region"""
        gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        
        # Resize to standard size for consistency
        gray = cv2.resize(gray, (128, 128))
        
        # Apply histogram equalization for better contrast
        gray = cv2.equalizeHist(gray)
        
        # Manual LBP implementation (compatible with all OpenCV versions)
        def local_binary_pattern(image, radius=3, n_points=24):
            """Simple LBP implementation"""
            rows, cols = image.shape
            lbp = np.zeros_like(image)
            
            for i in range(radius, rows - radius):
                for j in range(radius, cols - radius):
                    center = image[i, j]
                    code = 0
                    for k in range(n_points):
                        angle = 2 * np.pi * k / n_points
                        x = int(i + radius * np.cos(angle))
                        y = int(j + radius * np.sin(angle))
                        if x < rows and y < cols and image[x, y] >= center:
                            code |= (1 << k)
                    lbp[i, j] = code
            
            return lbp
        
        # Extract LBP features
        lbp_image = local_binary_pattern(gray)
        
        # Calculate histogram
        hist, _ = np.histogram(lbp_image.flatten(), bins=256, range=(0, 256))
        
        # Normalize histogram
        hist = hist.astype(np.float32)
        hist = hist / (np.sum(hist) + 1e-6)
        
        return hist

    def _extract_advanced_features(self, face_region: np.ndarray) -> np.ndarray:
        """Extract advanced facial features for better discrimination"""
        gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        gray = cv2.resize(gray, (128, 128))
        gray = cv2.equalizeHist(gray)
        
        features = []
        
        # 1. LBP features (primary)
        lbp_features = self._extract_lbp_features(face_region)
        features.extend(lbp_features)
        
        # 2. Gradient features
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        grad_hist, _ = np.histogram(gradient_magnitude.flatten(), bins=32, range=(0, 255))
        features.extend(grad_hist)
        
        # 3. Texture features using Gabor filters
        for theta in [0, 45, 90, 135]:
            kernel = cv2.getGaborKernel((21, 21), 5, np.radians(theta), 2*np.pi*0.5, 0.5, 0, ktype=cv2.CV_32F)
            filtered = cv2.filter2D(gray, cv2.CV_8UC3, kernel)
            gabor_hist, _ = np.histogram(filtered.flatten(), bins=16, range=(0, 255))
            features.extend(gabor_hist)
        
        # 4. Statistical features
        features.extend([
            np.mean(gray),
            np.std(gray),
            np.median(gray),
            np.percentile(gray, 25),
            np.percentile(gray, 75)
        ])
        
        return np.array(features, dtype=np.float32)

    def _process_multiple_photos(self, photos: List[Image.Image]) -> Dict:
        """Process multiple photos and extract consolidated features"""
        all_features = []
        valid_photos = 0
        face_regions = []
        
        logger.info(f"📸 Processing {len(photos)} photos for feature extraction")
        
        for i, photo in enumerate(photos):
            try:
                # Convert PIL to numpy array
                image_np = np.array(photo)
                
                # Detect faces
                faces = self._detect_faces(image_np)
                
                if len(faces) == 0:
                    logger.warning(f"⚠️ No face detected in photo {i+1}")
                    continue
                
                if len(faces) > 1:
                    logger.warning(f"⚠️ Multiple faces detected in photo {i+1}, using largest")
                
                # Use the largest face
                largest_face = max(faces, key=lambda f: f[2] * f[3])
                x, y, w, h = largest_face
                
                # Extract face region with padding
                padding = 20
                x1 = max(0, x - padding)
                y1 = max(0, y - padding)
                x2 = min(image_np.shape[1], x + w + padding)
                y2 = min(image_np.shape[0], y + h + padding)
                
                face_region = image_np[y1:y2, x1:x2]
                
                if face_region.size == 0:
                    continue
                
                # Extract advanced features
                features = self._extract_advanced_features(face_region)
                all_features.append(features)
                face_regions.append(face_region)
                valid_photos += 1
                
            except Exception as e:
                logger.error(f"❌ Error processing photo {i+1}: {e}")
                continue
        
        if valid_photos == 0:
            return {
                'success': False,
                'message': 'No valid faces detected in any photos',
                'faces_detected': 0
            }
        
        # Consolidate features from all photos
        all_features = np.array(all_features)
        
        # Create consolidated feature vector
        consolidated_features = {
            'mean_features': np.mean(all_features, axis=0),
            'std_features': np.std(all_features, axis=0),
            'median_features': np.median(all_features, axis=0),
            'min_features': np.min(all_features, axis=0),
            'max_features': np.max(all_features, axis=0),
            'individual_features': all_features.tolist(),
            'photo_count': valid_photos,
            'quality_score': self._calculate_quality_score(all_features)
        }
        
        logger.info(f"✅ Successfully processed {valid_photos}/{len(photos)} photos")
        logger.info(f"🎯 Quality score: {consolidated_features['quality_score']:.2f}")
        
        return {
            'success': True,
            'features': consolidated_features,
            'faces_detected': valid_photos,
            'message': f'Successfully processed {valid_photos} photos with high quality features'
        }

    def _save_original_photos(self, employee_id: str, photos: List[Image.Image]) -> bool:
        """Save original photos to employee's folder"""
        try:
            # Create employee folder
            employee_folder = self.storage_path / employee_id
            employee_folder.mkdir(exist_ok=True)
            
            logger.info(f"📁 Created/using folder: {employee_folder}")
            
            # Save each photo
            for i, photo in enumerate(photos, 1):
                photo_filename = f"original_{i:03d}.jpg"
                photo_path = employee_folder / photo_filename
                
                # Save photo with high quality
                photo.save(photo_path, 'JPEG', quality=95)
                logger.info(f"💾 Saved photo: {photo_filename}")
            
            logger.info(f"✅ Saved {len(photos)} original photos to {employee_folder}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving original photos: {e}")
            return False

    def _calculate_quality_score(self, features: np.ndarray) -> float:
        """Save original photos to employee's folder"""
        try:
            # Create employee folder
            employee_folder = self.storage_path / employee_id
            employee_folder.mkdir(exist_ok=True)
            
            logger.info(f"📁 Created/using folder: {employee_folder}")
            
            # Save each photo
            for i, photo in enumerate(photos, 1):
                photo_filename = f"original_{i:03d}.jpg"
                photo_path = employee_folder / photo_filename
                
                # Save photo with high quality
                photo.save(photo_path, 'JPEG', quality=95)
                logger.info(f"💾 Saved photo: {photo_filename}")
            
            logger.info(f"✅ Saved {len(photos)} original photos to {employee_folder}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving original photos: {e}")
            return False
    def _calculate_quality_score(self, features: np.ndarray) -> float:
        """Calculate quality score based on feature consistency"""
        if len(features) < 2:
            return 0.5
        
        # Calculate consistency across photos
        std_values = np.std(features, axis=0)
        consistency_score = 1.0 - np.mean(std_values) / (np.mean(features) + 1e-6)
        
        # Normalize to 0-1 range
        quality_score = max(0.0, min(1.0, consistency_score))
        
        return quality_score

    def register_face(self, employee_id: str, photos: List[Image.Image]) -> Dict:
        """Register face using multiple photos for maximum accuracy"""
        start_time = time.time()
        
        logger.info(f"📝 Registering face for employee: {employee_id}")
        logger.info(f"📸 Processing {len(photos)} photos")
        
        # Process all photos
        result = self._process_multiple_photos(photos)
        
        if not result['success']:
            return {
                'success': False,
                'message': result['message'],
                'encoding_saved': False,
                'faces_detected': result.get('faces_detected', 0)
            }
        
        # Save original photos to employee folder
        photos_saved = self._save_original_photos(employee_id, photos)
        if not photos_saved:
            logger.warning("⚠️ Failed to save original photos, but continuing with registration")
        
        # Create employee folder for features
        employee_folder = self.storage_path / employee_id
        employee_folder.mkdir(exist_ok=True)
        
        # Save consolidated features in employee folder
        features_file = employee_folder / "features.pkl"
        metadata_file = employee_folder / "metadata.json"
        
        try:
            # Save features
            with open(features_file, 'wb') as f:
                pickle.dump(result['features'], f)
            
            # Save metadata
            metadata = {
                'employee_id': employee_id,
                'registration_time': time.time(),
                'photo_count': result['faces_detected'],
                'quality_score': result['features']['quality_score'],
                'feature_dimensions': len(result['features']['mean_features']),
                'confidence_threshold': self.confidence_threshold,
                'original_photos_saved': photos_saved,
                'photos_folder': str(employee_folder),
                'storage_structure': 'individual_employee_folders'
            }
            
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            processing_time = (time.time() - start_time) * 1000
            
            logger.info(f"✅ Face registration successful for {employee_id}")
            logger.info(f"⏱️ Processing time: {processing_time:.2f}ms")
            
            return {
                'success': True,
                'message': f'Face registered successfully with {result["faces_detected"]} photos',
                'encoding_saved': True,
                'faces_detected': result['faces_detected'],
                'quality_score': result['features']['quality_score'],
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            logger.error(f"❌ Error saving face data: {e}")
            return {
                'success': False,
                'message': f'Failed to save face data: {str(e)}',
                'encoding_saved': False,
                'faces_detected': result['faces_detected']
            }

    def verify_face(self, employee_id: str, selfie: Image.Image) -> Dict:
        """Verify face against registered features"""
        start_time = time.time()
        
        logger.info(f"🔍 Verifying face for employee: {employee_id}")
        
        # Check if employee is registered (new folder structure)
        employee_folder = self.storage_path / employee_id
        features_file = employee_folder / "features.pkl"
        
        if not features_file.exists():
            return {
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': 'Employee face not registered',
                'faces_detected': 0
            }
        
        # Load registered features
        try:
            with open(features_file, 'rb') as f:
                registered_features = pickle.load(f)
        except Exception as e:
            logger.error(f"❌ Error loading registered features: {e}")
            return {
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': 'Failed to load registered face data',
                'faces_detected': 0
            }
        
        # Process selfie
        result = self._process_multiple_photos([selfie])
        
        if not result['success']:
            return {
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': result['message'],
                'faces_detected': 0
            }
        
        selfie_features = result['features']
        
        # Compare features using multiple methods
        confidence_scores = []
        
        # 1. Compare with mean features
        mean_similarity = self._calculate_similarity(
            registered_features['mean_features'],
            selfie_features['mean_features']
        )
        confidence_scores.append(mean_similarity)
        
        # 2. Compare with median features
        median_similarity = self._calculate_similarity(
            registered_features['median_features'],
            selfie_features['median_features']
        )
        confidence_scores.append(median_similarity)
        
        # 3. Compare with individual registered photos
        individual_scores = []
        for reg_features in registered_features['individual_features']:
            similarity = self._calculate_similarity(
                np.array(reg_features),
                selfie_features['mean_features']
            )
            individual_scores.append(similarity)
        
        # Use best match from individual comparisons
        best_individual = max(individual_scores) if individual_scores else 0.0
        confidence_scores.append(best_individual)
        
        # Calculate final confidence (weighted average)
        final_confidence = (
            0.4 * mean_similarity +
            0.3 * median_similarity +
            0.3 * best_individual
        )
        
        # Apply quality bonus
        quality_bonus = min(0.05, registered_features['quality_score'] * 0.05)
        final_confidence += quality_bonus
        
        # Ensure confidence is in valid range
        final_confidence = max(0.0, min(1.0, final_confidence))
        
        is_verified = final_confidence >= self.confidence_threshold
        
        processing_time = (time.time() - start_time) * 1000
        
        logger.info(f"🎯 Verification result: {final_confidence:.3f} ({'✅ PASS' if is_verified else '❌ FAIL'})")
        logger.info(f"⏱️ Processing time: {processing_time:.2f}ms")
        
        return {
            'success': True,
            'verified': is_verified,
            'confidence': final_confidence,
            'message': f'Face verification {"successful" if is_verified else "failed"} ({final_confidence:.1%} confidence)',
            'faces_detected': result['faces_detected'],
            'processing_time_ms': processing_time,
            'quality_score': selfie_features['quality_score'],
            'threshold': self.confidence_threshold
        }

    def _calculate_similarity(self, features1: np.ndarray, features2: np.ndarray) -> float:
        """Calculate similarity between two feature vectors"""
        try:
            # Ensure same dimensions
            min_len = min(len(features1), len(features2))
            f1 = features1[:min_len]
            f2 = features2[:min_len]
            
            # Normalize features
            f1_norm = f1 / (np.linalg.norm(f1) + 1e-6)
            f2_norm = f2 / (np.linalg.norm(f2) + 1e-6)
            
            # Calculate cosine similarity
            cosine_sim = np.dot(f1_norm, f2_norm)
            
            # Calculate correlation coefficient
            correlation = np.corrcoef(f1, f2)[0, 1]
            if np.isnan(correlation):
                correlation = 0.0
            
            # Calculate Euclidean distance (inverted and normalized)
            euclidean_dist = np.linalg.norm(f1_norm - f2_norm)
            euclidean_sim = 1.0 / (1.0 + euclidean_dist)
            
            # Weighted combination
            similarity = (
                0.5 * cosine_sim +
                0.3 * correlation +
                0.2 * euclidean_sim
            )
            
            # Ensure positive similarity
            similarity = max(0.0, similarity)
            
            return similarity
            
        except Exception as e:
            logger.error(f"❌ Error calculating similarity: {e}")
            return 0.0

    def get_registration_info(self, employee_id: str) -> Dict:
        """Get registration information for an employee"""
        employee_folder = self.storage_path / employee_id
        metadata_file = employee_folder / "metadata.json"
        
        if not metadata_file.exists():
            return {
                'registered': False,
                'message': 'Employee not registered'
            }
        
        try:
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            
            return {
                'registered': True,
                'employee_id': metadata['employee_id'],
                'registration_time': metadata['registration_time'],
                'photo_count': metadata['photo_count'],
                'quality_score': metadata['quality_score'],
                'feature_dimensions': metadata['feature_dimensions'],
                'confidence_threshold': metadata['confidence_threshold']
            }
            
        except Exception as e:
            logger.error(f"❌ Error reading metadata: {e}")
            return {
                'registered': False,
                'message': f'Error reading registration data: {str(e)}'
            }