"""
Deep Learning Face Recognition Service
Using FaceNet for embeddings and MTCNN for face detection
"""
import cv2
import numpy as np
import time
from PIL import Image
import torch
import torch.nn.functional as F
from facenet_pytorch import MTCNN, InceptionResnetV1
from sklearn.metrics.pairwise import cosine_similarity
import warnings
warnings.filterwarnings('ignore')

class DeepLearningFaceService:
    """
    Advanced face recognition using deep learning models
    """
    
    def __init__(self):
        self.confidence_threshold = 0.85  # Higher threshold for deep learning (0-1 scale)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        print(f"🔧 Initializing Deep Learning Face Recognition...")
        print(f"📱 Device: {self.device}")
        
        # Initialize MTCNN for face detection
        self.mtcnn = MTCNN(
            image_size=160,
            margin=0,
            min_face_size=20,
            thresholds=[0.6, 0.7, 0.7],  # More lenient thresholds
            factor=0.709,
            post_process=True,
            device=self.device
        )
        
        # Initialize FaceNet model for face embeddings
        self.facenet = InceptionResnetV1(pretrained='vggface2').eval().to(self.device)
        
        print(f"✅ Deep Learning models loaded successfully")
    
    def detect_and_extract_face(self, image):
        """
        Detect face using MTCNN and extract face region
        
        Args:
            image: PIL Image
            
        Returns:
            tuple: (face_tensor, face_image, detection_confidence)
        """
        try:
            # Convert PIL to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Detect face with MTCNN
            face_tensor, prob = self.mtcnn(image, return_prob=True)
            
            if face_tensor is None or prob is None:
                return None, None, 0.0
            
            # MTCNN returns tensor in range [-1, 1], we need [0, 1]
            face_tensor = (face_tensor + 1) / 2
            
            # Convert tensor back to PIL Image for visualization
            face_array = face_tensor.permute(1, 2, 0).cpu().numpy()
            face_array = (face_array * 255).astype(np.uint8)
            face_image = Image.fromarray(face_array)
            
            return face_tensor, face_image, float(prob)
            
        except Exception as e:
            print(f"Error in face detection: {e}")
            return None, None, 0.0
    
    def extract_face_embedding(self, face_tensor):
        """
        Extract 512-dimensional face embedding using FaceNet
        
        Args:
            face_tensor: Preprocessed face tensor from MTCNN
            
        Returns:
            numpy array: 512-dimensional face embedding
        """
        try:
            if face_tensor is None:
                return None
            
            # Ensure tensor is on correct device and has batch dimension
            face_tensor = face_tensor.unsqueeze(0).to(self.device)
            
            # Extract embedding using FaceNet
            with torch.no_grad():
                embedding = self.facenet(face_tensor)
                
            # Normalize embedding (important for cosine similarity)
            embedding = F.normalize(embedding, p=2, dim=1)
            
            return embedding.cpu().numpy().flatten()
            
        except Exception as e:
            print(f"Error extracting embedding: {e}")
            return None
    
    def compare_embeddings(self, embedding1, embedding2):
        """
        Compare two face embeddings using cosine similarity
        
        Args:
            embedding1: First face embedding
            embedding2: Second face embedding
            
        Returns:
            float: Similarity score (0-1, higher is more similar)
        """
        try:
            if embedding1 is None or embedding2 is None:
                return 0.0
            
            # Reshape for sklearn
            emb1 = embedding1.reshape(1, -1)
            emb2 = embedding2.reshape(1, -1)
            
            # Calculate cosine similarity
            similarity = cosine_similarity(emb1, emb2)[0][0]
            
            # Ensure similarity is between 0 and 1
            similarity = max(0.0, min(1.0, similarity))
            
            return float(similarity)
            
        except Exception as e:
            print(f"Error comparing embeddings: {e}")
            return 0.0
    
    def register_face(self, employee_id, image_pil):
        """
        Register employee face and extract deep learning embedding
        
        Args:
            employee_id: UUID of employee
            image_pil: PIL Image
            
        Returns:
            dict: Registration result with embedding
        """
        start_time = time.time()
        
        try:
            print(f"🔄 Processing face registration for {employee_id}")
            
            # Detect and extract face
            face_tensor, face_image, detection_confidence = self.detect_and_extract_face(image_pil)
            
            if face_tensor is None:
                return {
                    'success': False,
                    'message': 'No face detected in image. Please ensure your face is clearly visible and well-lit.',
                    'encoding_saved': False,
                    'faces_detected': 0,
                    'detection_confidence': 0.0
                }
            
            print(f"✅ Face detected with confidence: {detection_confidence:.3f}")
            
            # Extract face embedding
            embedding = self.extract_face_embedding(face_tensor)
            
            if embedding is None:
                return {
                    'success': False,
                    'message': 'Failed to extract face features. Please try with a clearer image.',
                    'encoding_saved': False,
                    'faces_detected': 1,
                    'detection_confidence': detection_confidence
                }
            
            processing_time = int((time.time() - start_time) * 1000)
            
            print(f"✅ Face embedding extracted: {embedding.shape} dimensions")
            
            return {
                'success': True,
                'message': 'Face registered successfully with deep learning',
                'encoding_saved': True,
                'faces_detected': 1,
                'detection_confidence': detection_confidence,
                'embedding': embedding.tolist(),  # Convert to list for JSON serialization
                'embedding_dimensions': len(embedding),
                'processing_time_ms': processing_time
            }
        
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            print(f"❌ Registration error: {e}")
            return {
                'success': False,
                'message': f'Error during face registration: {str(e)}',
                'encoding_saved': False,
                'faces_detected': 0,
                'processing_time_ms': processing_time
            }
    
    def verify_face(self, stored_embedding, selfie_pil, employee_id=None):
        """
        Verify face against stored embedding using deep learning
        
        Args:
            stored_embedding: Previously stored face embedding
            selfie_pil: PIL Image of current selfie
            employee_id: Employee ID for logging
            
        Returns:
            dict: Verification result
        """
        start_time = time.time()
        
        try:
            print(f"🔍 Processing face verification for {employee_id}")
            
            if stored_embedding is None:
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': 'No stored face embedding found',
                    'faces_detected': 0
                }
            
            # Detect and extract face from selfie
            face_tensor, face_image, detection_confidence = self.detect_and_extract_face(selfie_pil)
            
            if face_tensor is None:
                processing_time = int((time.time() - start_time) * 1000)
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': 'No face detected in selfie. Please ensure your face is clearly visible.',
                    'faces_detected': 0,
                    'processing_time_ms': processing_time
                }
            
            print(f"✅ Selfie face detected with confidence: {detection_confidence:.3f}")
            
            # Extract embedding from selfie
            selfie_embedding = self.extract_face_embedding(face_tensor)
            
            if selfie_embedding is None:
                processing_time = int((time.time() - start_time) * 1000)
                return {
                    'success': False,
                    'verified': False,
                    'confidence': 0.0,
                    'message': 'Failed to process selfie. Please try again with better lighting.',
                    'faces_detected': 1,
                    'processing_time_ms': processing_time
                }
            
            # Convert stored embedding back to numpy array
            if isinstance(stored_embedding, list):
                stored_embedding = np.array(stored_embedding)
            
            # Compare embeddings
            similarity = self.compare_embeddings(stored_embedding, selfie_embedding)
            
            # Determine if verified (using threshold)
            is_verified = similarity >= self.confidence_threshold
            
            processing_time = int((time.time() - start_time) * 1000)
            
            print(f"📊 Face similarity: {similarity:.3f} (threshold: {self.confidence_threshold})")
            print(f"🎯 Verification result: {'PASS' if is_verified else 'FAIL'}")
            
            # Convert similarity to percentage for display
            confidence_percentage = similarity * 100
            
            if is_verified:
                return {
                    'success': True,
                    'verified': True,
                    'confidence': round(confidence_percentage, 2),
                    'similarity_score': round(similarity, 4),
                    'message': f'Face verified successfully (Similarity: {similarity:.3f})',
                    'faces_detected': 1,
                    'detection_confidence': detection_confidence,
                    'processing_time_ms': processing_time
                }
            else:
                return {
                    'success': True,
                    'verified': False,
                    'confidence': round(confidence_percentage, 2),
                    'similarity_score': round(similarity, 4),
                    'message': f'Face verification failed. Similarity too low: {similarity:.3f} (Required: {self.confidence_threshold})',
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
                'message': f'Error during face verification: {str(e)}',
                'faces_detected': 0,
                'processing_time_ms': processing_time
            }
    
    def get_model_info(self):
        """
        Get information about the loaded models
        """
        return {
            'face_detection': 'MTCNN (Multi-task CNN)',
            'face_recognition': 'FaceNet (InceptionResnetV1)',
            'pretrained_on': 'VGGFace2 dataset',
            'embedding_dimensions': 512,
            'confidence_threshold': self.confidence_threshold,
            'device': str(self.device),
            'cuda_available': torch.cuda.is_available()
        }