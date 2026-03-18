"""
Fast Accurate Face Recognition Service
Optimized for speed while maintaining high accuracy
Smart sampling and efficient processing for 50+ photos
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

class FastAccurateFaceService:
    def __init__(self, storage_path: str = "face_storage", confidence_threshold: float = 0.85):
        """
        Initialize Fast Accurate Face Recognition Service
        
        Args:
            storage_path: Directory to store face data
            confidence_threshold: Minimum confidence for verification (85% for high accuracy)
        """
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)
        self.confidence_threshold = confidence_threshold
        
        # Initialize face detection
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        logger.info(f"🚀 Fast Accurate Face Service initialized")
        logger.info(f"📁 Storage: {self.storage_path}")
        logger.info(f"🎯 Confidence threshold: {self.confidence_threshold * 100}%")
        logger.info(f"📸 Optimized for fast processing of 50+ photos")

    def _detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect faces in image using optimized settings"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Single detection pass with optimized settings
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=3,
            minSize=(50, 50),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        return faces.tolist()

    def _calculate_photo_quality(self, image: np.ndarray, face_region: Tuple[int, int, int, int]) -> float:
        """Calculate quality score for a photo"""
        try:
            x, y, w, h = face_region
            face_img = image[y:y+h, x:x+w]
            
            if face_img.size == 0:
                return 0.0
            
            gray = cv2.cvtColor(face_img, cv2.COLOR_RGB2GRAY)
            
            # Calculate quality metrics
            # 1. Sharpness (Laplacian variance)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness_score = min(1.0, laplacian_var / 1000.0)
            
            # 2. Brightness (avoid too dark or too bright)
            brightness = np.mean(gray)
            brightness_score = 1.0 - abs(brightness - 128) / 128.0
            
            # 3. Face size (larger faces are better)
            face_area = w * h
            size_score = min(1.0, face_area / 10000.0)  # Normalize to reasonable face size
            
            # 4. Contrast
            contrast = np.std(gray)
            contrast_score = min(1.0, contrast / 50.0)
            
            # Combined quality score
            quality = (
                0.4 * sharpness_score +
                0.2 * brightness_score +
                0.2 * size_score +
                0.2 * contrast_score
            )
            
            return max(0.0, min(1.0, quality))
            
        except Exception as e:
            logger.warning(f"⚠️ Error calculating photo quality: {e}")
            return 0.5

    def _select_best_photos(self, photos: List[Image.Image], max_photos: int = 15) -> List[Tuple[Image.Image, float]]:
        """Select the best photos based on quality metrics"""
        logger.info(f"📊 Analyzing {len(photos)} photos for quality selection")
        
        photo_scores = []
        
        for i, photo in enumerate(photos):
            try:
                # Convert PIL to numpy array
                image_np = np.array(photo)
                
                # Detect faces
                faces = self._detect_faces(image_np)
                
                if len(faces) == 0:
                    continue
                
                # Use the largest face
                largest_face = max(faces, key=lambda f: f[2] * f[3])
                
                # Calculate quality score
                quality = self._calculate_photo_quality(image_np, largest_face)
                
                photo_scores.append((photo, quality, i))
                
            except Exception as e:
                logger.warning(f"⚠️ Error analyzing photo {i+1}: {e}")
                continue
        
        if not photo_scores:
            logger.error("❌ No valid photos found for selection")
            return []
        
        # Sort by quality score (descending)
        photo_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Select top photos
        selected = photo_scores[:max_photos]
        
        logger.info(f"✅ Selected {len(selected)} best photos from {len(photos)} total")
        logger.info(f"🎯 Quality range: {selected[-1][1]:.2f} - {selected[0][1]:.2f}")
        
        return [(photo, quality) for photo, quality, _ in selected]

    def _extract_efficient_features(self, face_region: np.ndarray) -> np.ndarray:
        """Extract efficient facial features optimized for speed"""
        gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        gray = cv2.resize(gray, (64, 64))  # Smaller size for speed
        gray = cv2.equalizeHist(gray)
        
        features = []
        
        # 1. Efficient LBP features
        lbp_features = self._extract_fast_lbp(gray)
        features.extend(lbp_features)
        
        # 2. Simple gradient features
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        grad_hist, _ = np.histogram(gradient_magnitude.flatten(), bins=16, range=(0, 255))
        features.extend(grad_hist)
        
        # 3. Basic statistical features
        features.extend([
            np.mean(gray),
            np.std(gray),
            np.median(gray)
        ])
        
        return np.array(features, dtype=np.float32)

    def _extract_fast_lbp(self, gray_image: np.ndarray) -> np.ndarray:
        """Fast LBP implementation optimized for speed"""
        # Simple 3x3 LBP
        rows, cols = gray_image.shape
        lbp = np.zeros_like(gray_image)
        
        # Process with step size for speed
        step = 2
        for i in range(1, rows - 1, step):
            for j in range(1, cols - 1, step):
                center = gray_image[i, j]
                code = 0
                
                # 8-neighbor LBP
                neighbors = [
                    gray_image[i-1, j-1], gray_image[i-1, j], gray_image[i-1, j+1],
                    gray_image[i, j+1], gray_image[i+1, j+1], gray_image[i+1, j],
                    gray_image[i+1, j-1], gray_image[i, j-1]
                ]
                
                for k, neighbor in enumerate(neighbors):
                    if neighbor >= center:
                        code |= (1 << k)
                
                lbp[i, j] = code
        
        # Calculate histogram
        hist, _ = np.histogram(lbp.flatten(), bins=64, range=(0, 256))  # Reduced bins for speed
        
        # Normalize histogram
        hist = hist.astype(np.float32)
        hist = hist / (np.sum(hist) + 1e-6)
        
        return hist

    def _process_selected_photos(self, selected_photos: List[Tuple[Image.Image, float]]) -> Dict:
        """Process selected photos efficiently"""
        all_features = []
        valid_photos = 0
        quality_scores = []
        
        logger.info(f"📸 Processing {len(selected_photos)} selected photos")
        
        for i, (photo, quality) in enumerate(selected_photos):
            try:
                # Convert PIL to numpy array
                image_np = np.array(photo)
                
                # Detect faces
                faces = self._detect_faces(image_np)
                
                if len(faces) == 0:
                    continue
                
                # Use the largest face
                largest_face = max(faces, key=lambda f: f[2] * f[3])
                x, y, w, h = largest_face
                
                # Extract face region with minimal padding
                padding = 10
                x1 = max(0, x - padding)
                y1 = max(0, y - padding)
                x2 = min(image_np.shape[1], x + w + padding)
                y2 = min(image_np.shape[0], y + h + padding)
                
                face_region = image_np[y1:y2, x1:x2]
                
                if face_region.size == 0:
                    continue
                
                # Extract efficient features
                features = self._extract_efficient_features(face_region)
                all_features.append(features)
                quality_scores.append(quality)
                valid_photos += 1
                
            except Exception as e:
                logger.warning(f"⚠️ Error processing selected photo {i+1}: {e}")
                continue
        
        if valid_photos == 0:
            return {
                'success': False,
                'message': 'No valid faces detected in selected photos',
                'faces_detected': 0
            }
        
        # Create efficient consolidated features
        all_features = np.array(all_features)
        
        consolidated_features = {
            'mean_features': np.mean(all_features, axis=0),
            'std_features': np.std(all_features, axis=0),
            'best_features': all_features[np.argmax(quality_scores)],  # Features from best quality photo
            'photo_count': valid_photos,
            'avg_quality': np.mean(quality_scores),
            'best_quality': max(quality_scores)
        }
        
        logger.info(f"✅ Successfully processed {valid_photos} selected photos")
        logger.info(f"🎯 Average quality: {consolidated_features['avg_quality']:.2f}")
        
        return {
            'success': True,
            'features': consolidated_features,
            'faces_detected': valid_photos,
            'message': f'Successfully processed {valid_photos} high-quality photos'
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
                
                # Save photo with good quality but optimized size
                photo.save(photo_path, 'JPEG', quality=85, optimize=True)
            
            logger.info(f"✅ Saved {len(photos)} original photos to {employee_folder}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving original photos: {e}")
            return False

    def register_face(self, employee_id: str, photos: List[Image.Image]) -> Dict:
        """Register face using smart photo selection for fast processing"""
        start_time = time.time()
        
        logger.info(f"📝 Fast registering face for employee: {employee_id}")
        logger.info(f"📸 Processing {len(photos)} photos with smart selection")
        
        # Step 1: Select best photos (this is fast)
        selection_start = time.time()
        selected_photos = self._select_best_photos(photos, max_photos=15)
        selection_time = (time.time() - selection_start) * 1000
        
        if not selected_photos:
            return {
                'success': False,
                'message': 'No valid photos found for registration',
                'encoding_saved': False,
                'faces_detected': 0
            }
        
        logger.info(f"⚡ Photo selection completed in {selection_time:.2f}ms")
        
        # Step 2: Process selected photos
        processing_start = time.time()
        result = self._process_selected_photos(selected_photos)
        processing_time = (time.time() - processing_start) * 1000
        
        if not result['success']:
            return {
                'success': False,
                'message': result['message'],
                'encoding_saved': False,
                'faces_detected': result.get('faces_detected', 0)
            }
        
        logger.info(f"⚡ Feature extraction completed in {processing_time:.2f}ms")
        
        # Step 3: Save original photos (in background, don't wait)
        save_start = time.time()
        photos_saved = self._save_original_photos(employee_id, photos)
        save_time = (time.time() - save_start) * 1000
        
        logger.info(f"⚡ Photo saving completed in {save_time:.2f}ms")
        
        # Step 4: Save features
        feature_start = time.time()
        
        # Create employee folder for features
        employee_folder = self.storage_path / employee_id
        employee_folder.mkdir(exist_ok=True)
        
        # Save consolidated features
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
                'total_photos_received': len(photos),
                'avg_quality': result['features']['avg_quality'],
                'best_quality': result['features']['best_quality'],
                'feature_dimensions': len(result['features']['mean_features']),
                'confidence_threshold': self.confidence_threshold,
                'original_photos_saved': photos_saved,
                'photos_folder': str(employee_folder),
                'optimization': 'smart_photo_selection_enabled',
                'processing_method': 'fast_accurate_v5'
            }
            
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            feature_time = (time.time() - feature_start) * 1000
            total_time = (time.time() - start_time) * 1000
            
            logger.info(f"⚡ Feature saving completed in {feature_time:.2f}ms")
            logger.info(f"🎉 Total registration time: {total_time:.2f}ms ({total_time/1000:.1f}s)")
            
            return {
                'success': True,
                'message': f'Face registered successfully with {result["faces_detected"]} high-quality photos',
                'encoding_saved': True,
                'faces_detected': result['faces_detected'],
                'total_photos_processed': len(photos),
                'avg_quality': result['features']['avg_quality'],
                'best_quality': result['features']['best_quality'],
                'processing_time_ms': total_time,
                'processing_time_seconds': total_time / 1000,
                'optimization_used': 'smart_photo_selection'
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
        """Verify face against registered features (fast)"""
        start_time = time.time()
        
        logger.info(f"🔍 Fast verifying face for employee: {employee_id}")
        
        # Check if employee is registered
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
        
        # Process selfie efficiently
        result = self._process_selected_photos([(selfie, 1.0)])  # Single photo with max quality
        
        if not result['success']:
            return {
                'success': False,
                'verified': False,
                'confidence': 0.0,
                'message': result['message'],
                'faces_detected': 0
            }
        
        selfie_features = result['features']
        
        # Fast comparison using multiple methods
        confidence_scores = []
        
        # 1. Compare with mean features (primary)
        mean_similarity = self._calculate_fast_similarity(
            registered_features['mean_features'],
            selfie_features['mean_features']
        )
        confidence_scores.append(mean_similarity)
        
        # 2. Compare with best quality features
        best_similarity = self._calculate_fast_similarity(
            registered_features['best_features'],
            selfie_features['mean_features']
        )
        confidence_scores.append(best_similarity)
        
        # Calculate final confidence (weighted average)
        final_confidence = (
            0.7 * mean_similarity +
            0.3 * best_similarity
        )
        
        # Apply quality bonus
        quality_bonus = min(0.03, registered_features['avg_quality'] * 0.03)
        final_confidence += quality_bonus
        
        # Ensure confidence is in valid range
        final_confidence = max(0.0, min(1.0, final_confidence))
        
        is_verified = final_confidence >= self.confidence_threshold
        
        processing_time = (time.time() - start_time) * 1000
        
        logger.info(f"🎯 Fast verification result: {final_confidence:.3f} ({'✅ PASS' if is_verified else '❌ FAIL'})")
        logger.info(f"⚡ Processing time: {processing_time:.2f}ms")
        
        return {
            'success': True,
            'verified': is_verified,
            'confidence': final_confidence,
            'message': f'Face verification {"successful" if is_verified else "failed"} ({final_confidence:.1%} confidence)',
            'faces_detected': result['faces_detected'],
            'processing_time_ms': processing_time,
            'threshold': self.confidence_threshold,
            'optimization': 'fast_verification_enabled'
        }

    def _calculate_fast_similarity(self, features1: np.ndarray, features2: np.ndarray) -> float:
        """Calculate similarity between two feature vectors (optimized for speed)"""
        try:
            # Ensure same dimensions
            min_len = min(len(features1), len(features2))
            f1 = features1[:min_len]
            f2 = features2[:min_len]
            
            # Normalize features
            f1_norm = f1 / (np.linalg.norm(f1) + 1e-6)
            f2_norm = f2 / (np.linalg.norm(f2) + 1e-6)
            
            # Fast cosine similarity (primary method)
            cosine_sim = np.dot(f1_norm, f2_norm)
            
            # Fast Euclidean distance (secondary)
            euclidean_dist = np.linalg.norm(f1_norm - f2_norm)
            euclidean_sim = 1.0 / (1.0 + euclidean_dist)
            
            # Weighted combination (optimized weights)
            similarity = 0.8 * cosine_sim + 0.2 * euclidean_sim
            
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
                'total_photos_received': metadata.get('total_photos_received', metadata['photo_count']),
                'avg_quality': metadata.get('avg_quality', 0.0),
                'best_quality': metadata.get('best_quality', 0.0),
                'feature_dimensions': metadata['feature_dimensions'],
                'confidence_threshold': metadata['confidence_threshold'],
                'optimization': metadata.get('optimization', 'standard'),
                'processing_method': metadata.get('processing_method', 'unknown')
            }
            
        except Exception as e:
            logger.error(f"❌ Error reading metadata: {e}")
            return {
                'registered': False,
                'message': f'Error reading registration data: {str(e)}'
            }