"""
Configuration for ML Face Recognition Service
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask settings
    FLASK_HOST = os.getenv('ML_SERVICE_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('ML_SERVICE_PORT', 5000))
    DEBUG = os.getenv('ML_SERVICE_DEBUG', 'False').lower() == 'true'
    
    # Supabase settings
    SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
    SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    # Face recognition settings
    FACE_CONFIDENCE_THRESHOLD = float(os.getenv('FACE_CONFIDENCE_THRESHOLD', '30.0'))  # Lowered from 80.0 for testing
    MAX_FACE_DISTANCE = float(os.getenv('MAX_FACE_DISTANCE', '0.6'))  # Lower = stricter
    
    # Image processing settings
    MAX_IMAGE_SIZE = 1024  # Max width/height in pixels
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    
    # Performance settings
    FACE_DETECTION_MODEL = 'hog'  # 'hog' (faster) or 'cnn' (more accurate)
    NUM_JITTERS = 1  # Number of times to re-sample face for encoding (higher = more accurate but slower)
    
    # Storage settings
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './uploads')
    TEMP_FOLDER = os.getenv('TEMP_FOLDER', './temp')
