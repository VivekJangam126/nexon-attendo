"""
Image processing utilities for face recognition
"""
import base64
import io
import numpy as np
from PIL import Image
import cv2

def base64_to_image(base64_string):
    """
    Convert base64 string to PIL Image
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        PIL Image object
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return image
    except Exception as e:
        raise ValueError(f"Failed to decode base64 image: {str(e)}")

def image_to_numpy(image):
    """
    Convert PIL Image to numpy array for face_recognition library
    
    Args:
        image: PIL Image object
        
    Returns:
        numpy array in RGB format
    """
    return np.array(image)

def resize_image(image, max_size=1024):
    """
    Resize image while maintaining aspect ratio
    
    Args:
        image: PIL Image object
        max_size: Maximum width or height
        
    Returns:
        Resized PIL Image
    """
    width, height = image.size
    
    if width <= max_size and height <= max_size:
        return image
    
    # Calculate new dimensions
    if width > height:
        new_width = max_size
        new_height = int(height * (max_size / width))
    else:
        new_height = max_size
        new_width = int(width * (max_size / height))
    
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

def enhance_image(image):
    """
    Enhance image quality for better face detection
    
    Args:
        image: PIL Image object
        
    Returns:
        Enhanced PIL Image
    """
    # Convert to numpy array
    img_array = np.array(image)
    
    # Apply histogram equalization for better contrast
    img_yuv = cv2.cvtColor(img_array, cv2.COLOR_RGB2YUV)
    img_yuv[:,:,0] = cv2.equalizeHist(img_yuv[:,:,0])
    img_enhanced = cv2.cvtColor(img_yuv, cv2.COLOR_YUV2RGB)
    
    return Image.fromarray(img_enhanced)

def validate_image(image):
    """
    Validate image meets requirements
    
    Args:
        image: PIL Image object
        
    Returns:
        tuple: (is_valid, error_message)
    """
    width, height = image.size
    
    # Check minimum size
    if width < 200 or height < 200:
        return False, "Image too small. Minimum size is 200x200 pixels."
    
    # Check aspect ratio (should be roughly square for face photos)
    aspect_ratio = width / height
    if aspect_ratio < 0.5 or aspect_ratio > 2.0:
        return False, "Image aspect ratio is too extreme. Please use a more square image."
    
    return True, None

def image_to_base64(image):
    """
    Convert PIL Image to base64 string
    
    Args:
        image: PIL Image object
        
    Returns:
        Base64 encoded string
    """
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG", quality=85)
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/jpeg;base64,{img_str}"
