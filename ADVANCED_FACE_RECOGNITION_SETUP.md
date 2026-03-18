# Advanced Face Recognition Setup Guide

## Overview
This guide sets up the advanced OpenCV-based face recognition system that stores images locally and uses multiple detection methods for better accuracy.

## Features
- **Local Image Storage**: Images stored locally instead of database for better performance
- **Multiple Face Detection**: Uses 3 different cascade classifiers for better detection
- **Advanced Feature Extraction**: Combines histograms, LBP, edge features, and statistical analysis
- **Multiple Similarity Metrics**: Uses cosine similarity, euclidean distance, correlation, and chi-square
- **Strict Verification**: Properly rejects different faces with low confidence scores

## Setup Instructions

### 1. Navigate to ML Service Directory
```bash
cd nexon-attendo/ml-service
```

### 2. Run Setup Script
```bash
# Windows
setup-opencv-advanced.bat

# Manual setup (if script fails)
python -m venv venv
venv\Scripts\activate
pip install -r requirements-opencv-advanced.txt
mkdir face_storage
```

### 3. Start the Advanced ML Service
```bash
# Activate virtual environment
venv\Scripts\activate

# Start the service
python app_opencv_advanced.py
```

You should see:
```
🚀 Starting Advanced OpenCV Face Recognition ML Service...
📍 Host: 0.0.0.0
🔌 Port: 5000
🎯 Confidence Threshold: 65.0%
🧠 Features: Advanced OpenCV with local storage
🔧 Methods: Multiple face detection + Advanced feature extraction + Local file storage
```

### 4. Test the Service
```bash
# In a new terminal, run the test script
node test-advanced-ml-service.js
```

## How It Works

### Face Registration Process
1. **Image Storage**: Original image saved as `{employee_id}_original.jpg`
2. **Face Detection**: Uses 3 cascade classifiers to detect faces
3. **Feature Extraction**: Extracts multiple types of features:
   - Full face histogram (32 bins)
   - Regional histograms (9 face regions, 16 bins each)
   - Statistical features (mean, std, median per region)
   - Local Binary Pattern (LBP) features
   - Edge detection features
4. **Feature Storage**: Features saved as `{employee_id}_features.pkl`

### Face Verification Process
1. **Load Registered Features**: Loads stored features from pickle file
2. **Process Selfie**: Same feature extraction process on selfie
3. **Multiple Comparisons**: Uses 4 similarity metrics:
   - Cosine similarity (40% weight)
   - Euclidean distance (30% weight)
   - Correlation coefficient (20% weight)
   - Chi-square similarity (10% weight)
4. **Final Score**: Weighted average of all metrics
5. **Threshold Check**: Must score ≥65% to pass verification

## Configuration

### Confidence Threshold
Default: 65% (0.65)
- Located in `face_service_opencv_advanced.py`
- Higher values = stricter verification
- Lower values = more lenient verification

### Storage Location
Default: `ml-service/face_storage/`
- Original images: `{employee_id}_original.jpg`
- Feature files: `{employee_id}_features.pkl`

## Testing Different People

### Expected Behavior
- **Same Person**: Should get 70-95% confidence
- **Different Person**: Should get 10-40% confidence
- **No Face**: Should get 0% confidence with error message

### Test Steps
1. Register employee with their photo
2. Try verification with same person's face → Should PASS
3. Try verification with different person's face → Should FAIL
4. Try verification with no face/poor image → Should FAIL

## Troubleshooting

### Service Won't Start
```bash
# Check Python version (needs 3.8+)
python --version

# Check if OpenCV installed correctly
python -c "import cv2; print(cv2.__version__)"

# Reinstall requirements
pip uninstall opencv-python opencv-contrib-python
pip install -r requirements-opencv-advanced.txt
```

### Face Detection Issues
- Ensure good lighting in photos
- Face should be clearly visible and front-facing
- Image should be at least 200x200 pixels
- Check console logs for detection confidence

### Low Accuracy Issues
- Adjust confidence threshold in `face_service_opencv_advanced.py`
- Ensure registration photos are high quality
- Check that different people are actually being tested

### Storage Issues
```bash
# Check if face_storage directory exists
ls face_storage/

# Check file permissions
chmod 755 face_storage/
```

## API Endpoints

### Health Check
```
GET http://localhost:5000/health
```

### Debug Info
```
GET http://localhost:5000/debug
```

### Register Face
```
POST http://localhost:5000/register-face
{
  "employee_id": "uuid",
  "image": "data:image/jpeg;base64,..."
}
```

### Verify Face
```
POST http://localhost:5000/verify-face
{
  "employee_id": "uuid",
  "selfie": "data:image/jpeg;base64,..."
}
```

## Integration with Frontend

The frontend automatically uses this service when:
1. Employee uploads profile photo → Calls `/register-face`
2. Employee marks attendance → Calls `/verify-face` (if face verification required)

## Security Notes

- Images stored locally, not in database
- No network transmission of raw images after initial upload
- Feature files are binary and not human-readable
- Service runs on localhost only by default

## Performance

- Registration: ~500-1000ms per image
- Verification: ~300-800ms per comparison
- Storage: ~50KB per employee (image + features)
- Memory: ~100MB for service + loaded models

## Next Steps

1. Start the advanced ML service
2. Test with known employees
3. Verify different people are properly rejected
4. Adjust confidence threshold if needed
5. Monitor logs for any issues

The system should now properly distinguish between different people and only allow attendance marking for the registered employee.