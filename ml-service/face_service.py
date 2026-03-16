"""
Core face recognition service
Handles face detection, encoding, and verification
"""
import face_recognition
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
    Face recognition service using face_recognition library
    """
    
    def __init__(self):
        self.confidence_threshold = Config.FACE_CONFIDENCE_THRESHOLD
        self.max_face_distance = Config.MAX_FACE_DISTANCE
        self.detection_model = Config.FACE_DETECTION_MODEL
        self.num_jitters = Config.NUM_JITTERS
    
    def register_face(self, employee_id, image_base64):
        """
        Register employee face from base64 image
        
        Args:
            employee_id: UUID of employee
            image_base64: Base64 encoded image
            
        Returns:
            dict: {
                'success': bool,
                'message': str,
                'encoding_saved': bool,
                'faces_detected': int
            }
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
            
            # Detect faces
            face_locations = face_recognition.face_locations(
                image_array, 
                model=self.detection_model
            )
            
            if len(face_locations) == 0:
                return {
                    'success': False,
                    'message': 'No face detected in image. Please ensure your face is clearly visible.',
                    'encoding_saved': False,
                    'faces_detected': 0
                }
            
            if len(face_locations) > 1:
                return {
                    'success': False,
                    'message': 'Multiple faces detected. Please ensure only one face is in the image.',
                    'encoding_saved': False,
                    'faces_detected': len(face_locations)
                }
            
            # Generate face encoding
            face_encodings = face_recognition.face_encodings(
                image_array,
                known_face_locations=face_locations,
                num_jitters=self.num_jitters
            )
            
            if len(face_encodings) == 0:
                return {
                    'success': False,
                    'message': 'Failed to generate face encoding. Please try with a clearer image.',
                    'encoding_saved': False,
                    'faces_detected': 1
                }
            
            # Save encoding to database
            encoding = face_encodings[0]
            saved = save_face_encoding(employee_id, encoding, self.confidence_threshold)
            
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
        Verify employee face against registered encoding
        
        Args:
            employee_id: UUID of employee
            selfie_base64: Base64 encoded selfie image
            attendance_id: UUID of attendance record (optional)
            
        Returns:
            dict: {
                'success': bool,
                'verified': bool,
                'confidence': float,
                'message': str,
                'faces_detected': int
            }
        """
        start_time = time.time()
        
        try:
            # Get stored face encoding
            stored_encoding, threshold = get_face_encoding(employee_id)
            
            if stored_encoding is None:
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
            
            # Detect faces in selfie
            face_locations = face_recognition.face_locations(
                selfie_array,
                model=self.detection_model
            )
            
            if len(face_locations) == 0:
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
            
            if len(face_locations) > 1:
                processing_time = int((time.time() - start_time) * 1000)
                log_verification_attempt(
                    employee_id, attendance_id, 0, 'failed', processing_time,
                    'Multiple faces detected'
                )
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0,
                    'message': 'Multiple faces detected. Please ensure only your face is visible.',
                    'faces_detected': len(face_locations),
                    'processing_time_ms': processing_time
                }
            
            # Generate encoding for selfie
            selfie_encodings = face_recognition.face_encodings(
                selfie_array,
                known_face_locations=face_locations,
                num_jitters=self.num_jitters
            )
            
            if len(selfie_encodings) == 0:
                processing_time = int((time.time() - start_time) * 1000)
                log_verification_attempt(
                    employee_id, attendance_id, 0, 'error', processing_time,
                    'Failed to generate face encoding'
                )
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0,
                    'message': 'Failed to process face. Please try again with better lighting.',
                    'faces_detected': 1,
                    'processing_time_ms': processing_time
                }
            
            # Compare faces
            selfie_encoding = selfie_encodings[0]
            stored_encoding_array = np.array(stored_encoding)
            
            # Calculate face distance (lower = more similar)
            face_distance = face_recognition.face_distance(
                [stored_encoding_array],
                selfie_encoding
            )[0]
            
            # Convert distance to confidence percentage
            # Distance ranges from 0 (identical) to 1+ (very different)
            # We invert and scale to 0-100%
            confidence = max(0, min(100, (1 - face_distance) * 100))
            
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
            dict: {
                'registered': bool,
                'message': str
            }
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
