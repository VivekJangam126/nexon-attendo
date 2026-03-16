"""
OpenCV-based face recognition service
Alternative implementation without dlib dependency
"""
import cv2
import numpy as np
import time
from utils.image_processor import (
    base64_to_image, 
    image_to_numpy, 
    resize_image, 
    enhance_image,
    validate_image
)
from utils.database import save_face_encoding, get_face_encoding, log_verification_attempt
from config import Config

class FaceRecognitionService:
    """
    Face recognition service using OpenCV
    """
    
    def __init__(self):
        self.confidence_threshold = Config.FACE_CONFIDENCE_THRESHOLD
        # Load OpenCV face detection cascade
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        # Initialize LBPH face recognizer
        self.face_recognizer = cv2.face.LBPHFaceRecognizer_create()
    
    def extract_face_features(self, image_array):
        """
        Extract face features using OpenCV
        
        Args:
            image_array: numpy array of image
            
        Returns:
            tuple: (face_region, features) or (None, None)
        """
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(100, 100)
        )
        
        if len(faces) == 0:
            return None, None
        
        if len(faces) > 1:
            return None, None
        
        # Extract the face region
        x, y, w, h = faces[0]
        face_region = gray[y:y+h, x:x+w]
        
        # Resize face to standard size
        face_region = cv2.resize(face_region, (200, 200))
        
        # Extract LBP features
        features = self.extract_lbp_features(face_region)
        
        return face_region, features
    
    def extract_lbp_features(self, face_region):
        """
        Extract Local Binary Pattern features
        
        Args:
            face_region: grayscale face image
            
        Returns:
            numpy array of features
        """
        # Calculate LBP
        lbp = np.zeros_like(face_region)
        
        for i in range(1, face_region.shape[0] - 1):
            for j in range(1, face_region.shape[1] - 1):
                center = face_region[i, j]
                binary_string = ''
                
                # Compare with 8 neighbors
                neighbors = [
                    face_region[i-1, j-1], face_region[i-1, j], face_region[i-1, j+1],
                    face_region[i, j+1], face_region[i+1, j+1], face_region[i+1, j],
                    face_region[i+1, j-1], face_region[i, j-1]
                ]
                
                for neighbor in neighbors:
                    binary_string += '1' if neighbor >= center else '0'
                
                lbp[i, j] = int(binary_string, 2)
        
        # Calculate histogram
        hist, _ = np.histogram(lbp.ravel(), bins=256, range=(0, 256))
        
        # Normalize histogram
        hist = hist.astype(float)
        hist /= (hist.sum() + 1e-7)
        
        return hist
    
    def compare_features(self, features1, features2):
        """
        Compare two feature vectors using correlation
        
        Args:
            features1: First feature vector
            features2: Second feature vector
            
        Returns:
            float: Similarity score (0-100)
        """
        # Calculate correlation coefficient
        correlation = np.corrcoef(features1, features2)[0, 1]
        
        # Handle NaN values
        if np.isnan(correlation):
            correlation = 0
        
        # Convert to percentage (0-100)
        similarity = max(0, min(100, (correlation + 1) * 50))
        
        return similarity
    
    def register_face(self, employee_id, image_base64):
        """
        Register employee face from base64 image
        
        Args:
            employee_id: UUID of employee
            image_base64: Base64 encoded image
            
        Returns:
            dict: Registration result
        """
        start_time = time.time()
        
        try:
            # Convert base64 to image
            image = base64_to_image(image_base64)
            
            # Validate image
            is_valid, error_msg = validate_image(image)
            if not is_valid:
                return {
                    'success': False,
                    'message': error_msg,
                    'encoding_saved': False,
                    'faces_detected': 0
                }
            
            # Resize and enhance image
            image = resize_image(image, Config.MAX_IMAGE_SIZE)
            image = enhance_image(image)
            
            # Convert to numpy array
            image_array = image_to_numpy(image)
            
            # Extract face features
            face_region, features = self.extract_face_features(image_array)
            
            if face_region is None:
                return {
                    'success': False,
                    'message': 'No face detected in image. Please ensure your face is clearly visible.',
                    'encoding_saved': False,
                    'faces_detected': 0
                }
            
            if features is None:
                return {
                    'success': False,
                    'message': 'Failed to extract face features. Please try with a clearer image.',
                    'encoding_saved': False,
                    'faces_detected': 1
                }
            
            # Save features to database
            saved = save_face_encoding(employee_id, features, self.confidence_threshold)
            
            processing_time = int((time.time() - start_time) * 1000)
            
            if saved:
                return {
                    'success': True,
                    'message': 'Face registered successfully',
                    'encoding_saved': True,
                    'faces_detected': 1,
                    'processing_time_ms': processing_time
                }
            else:
                return {
                    'success': False,
                    'message': 'Failed to save face encoding to database',
                    'encoding_saved': False,
                    'faces_detected': 1
                }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Error during face registration: {str(e)}',
                'encoding_saved': False,
                'faces_detected': 0
            }
    
    def verify_face(self, employee_id, selfie_base64, attendance_id=None):
        """
        Verify employee face against registered features
        
        Args:
            employee_id: UUID of employee
            selfie_base64: Base64 encoded selfie image
            attendance_id: UUID of attendance record (optional)
            
        Returns:
            dict: Verification result
        """
        start_time = time.time()
        
        try:
            # Get stored face features
            stored_features, threshold = get_face_encoding(employee_id)
            
            if stored_features is None:
                log_verification_attempt(
                    employee_id, attendance_id, 0, 'error', 0,
                    'No registered face found'
                )
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0,
                    'message': 'No registered face found. Please register your face first.',
                    'faces_detected': 0
                }
            
            # Convert base64 to image
            selfie = base64_to_image(selfie_base64)
            
            # Resize and enhance
            selfie = resize_image(selfie, Config.MAX_IMAGE_SIZE)
            selfie = enhance_image(selfie)
            
            # Convert to numpy
            selfie_array = image_to_numpy(selfie)
            
            # Extract face features from selfie
            face_region, selfie_features = self.extract_face_features(selfie_array)
            
            if face_region is None:
                processing_time = int((time.time() - start_time) * 1000)
                log_verification_attempt(
                    employee_id, attendance_id, 0, 'no_face', processing_time,
                    'No face detected in selfie'
                )
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0,
                    'message': 'No face detected in selfie. Please ensure your face is clearly visible.',
                    'faces_detected': 0,
                    'processing_time_ms': processing_time
                }
            
            if selfie_features is None:
                processing_time = int((time.time() - start_time) * 1000)
                log_verification_attempt(
                    employee_id, attendance_id, 0, 'error', processing_time,
                    'Failed to extract face features'
                )
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0,
                    'message': 'Failed to process face. Please try again with better lighting.',
                    'faces_detected': 1,
                    'processing_time_ms': processing_time
                }
            
            # Compare features
            stored_features_array = np.array(stored_features)
            confidence = self.compare_features(stored_features_array, selfie_features)
            
            # Use custom threshold if set, otherwise use default
            verification_threshold = threshold if threshold else self.confidence_threshold
            
            # Determine if verified
            is_verified = confidence >= verification_threshold
            
            processing_time = int((time.time() - start_time) * 1000)
            
            # Log verification attempt
            status = 'success' if is_verified else 'failed'
            log_verification_attempt(
                employee_id, attendance_id, confidence, status, processing_time
            )
            
            if is_verified:
                return {
                    'success': True,
                    'verified': True,
                    'confidence': round(confidence, 2),
                    'message': f'Face verified successfully (Confidence: {round(confidence, 2)}%)',
                    'faces_detected': 1,
                    'processing_time_ms': processing_time
                }
            else:
                return {
                    'success': True,
                    'verified': False,
                    'confidence': round(confidence, 2),
                    'message': f'Face verification failed. Confidence too low: {round(confidence, 2)}% (Required: {verification_threshold}%)',
                    'faces_detected': 1,
                    'processing_time_ms': processing_time
                }
        
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            log_verification_attempt(
                employee_id, attendance_id, 0, 'error', processing_time,
                str(e)
            )
            return {
                'success': False,
                'verified': False,
                'confidence': 0,
                'message': f'Error during face verification: {str(e)}',
                'faces_detected': 0,
                'processing_time_ms': processing_time
            }
    
    def check_face_registered(self, employee_id):
        """
        Check if employee has registered face
        
        Args:
            employee_id: UUID of employee
            
        Returns:
            dict: Registration status
        """
        encoding, _ = get_face_encoding(employee_id)
        
        if encoding:
            return {
                'registered': True,
                'message': 'Face is registered'
            }
        else:
            return {
                'registered': False,
                'message': 'No face registered'
            }