# Face Recognition ML Service

Python-based face recognition service for Nexon Attendo attendance system.

## Features

- ✅ Face registration from profile photos
- ✅ Face verification during attendance marking
- ✅ High accuracy using dlib and face_recognition library
- ✅ No ongoing API costs (runs on your server)
- ✅ Audit trail of all verification attempts
- ✅ Batch registration support

## Technology Stack

- **Flask**: Web framework for API server
- **face_recognition**: Face detection and recognition (built on dlib)
- **OpenCV**: Image processing
- **dlib**: Machine learning toolkit
- **NumPy**: Numerical computations
- **Pillow**: Image manipulation

## Prerequisites

### System Requirements

- **Python**: 3.8 or higher
- **RAM**: Minimum 2GB (4GB recommended)
- **CPU**: Any modern CPU (face recognition is CPU-intensive)
- **Storage**: ~500MB for libraries and models

### System Dependencies (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y python3 python3-pip
sudo apt install -y cmake build-essential
sudo apt install -y libopenblas-dev liblapack-dev
sudo apt install -y libx11-dev libgtk-3-dev
```

### System Dependencies (macOS)

```bash
brew install cmake
brew install python3
```

### System Dependencies (Windows)

- Install Visual Studio Build Tools
- Install CMake
- Install Python 3.8+

## Installation

### 1. Navigate to ml-service directory

```bash
cd nexon-attendo/ml-service
```

### 2. Create virtual environment (recommended)

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

**Note**: Installation may take 5-10 minutes as dlib needs to compile.

### 4. Configure environment variables

Create `.env` file in `ml-service` directory:

```env
# Flask settings
ML_SERVICE_HOST=0.0.0.0
ML_SERVICE_PORT=5000
ML_SERVICE_DEBUG=False

# Supabase settings (copy from parent .env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Face recognition settings
FACE_CONFIDENCE_THRESHOLD=80.0
MAX_FACE_DISTANCE=0.6

# Image processing
MAX_IMAGE_SIZE=1024
FACE_DETECTION_MODEL=hog  # 'hog' (faster) or 'cnn' (more accurate)
NUM_JITTERS=1  # Higher = more accurate but slower

# Storage
UPLOAD_FOLDER=./uploads
TEMP_FOLDER=./temp
```

### 5. Run database migration

Run the SQL migration in Supabase:

```bash
# In Supabase SQL Editor, run:
nexon-attendo/supabase/migrations/face_recognition_schema.sql
```

## Running the Service

### Development Mode

```bash
python app.py
```

Service will start on `http://localhost:5000`

### Production Mode (with Gunicorn)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### As a Background Service (systemd)

Create `/etc/systemd/system/face-recognition.service`:

```ini
[Unit]
Description=Face Recognition ML Service
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/nexon-attendo/ml-service
Environment="PATH=/path/to/nexon-attendo/ml-service/venv/bin"
ExecStart=/path/to/nexon-attendo/ml-service/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable face-recognition
sudo systemctl start face-recognition
sudo systemctl status face-recognition
```

## API Endpoints

### 1. Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "face-recognition-ml",
  "version": "1.0.0"
}
```

### 2. Register Face

```http
POST /register-face
Content-Type: application/json

{
  "employee_id": "uuid",
  "image": "base64_encoded_image"
}
```

Response:
```json
{
  "success": true,
  "message": "Face registered successfully",
  "encoding_saved": true,
  "faces_detected": 1,
  "processing_time_ms": 2341
}
```

### 3. Verify Face

```http
POST /verify-face
Content-Type: application/json

{
  "employee_id": "uuid",
  "selfie": "base64_encoded_selfie",
  "attendance_id": "uuid"  // optional
}
```

Response:
```json
{
  "success": true,
  "verified": true,
  "confidence": 92.45,
  "message": "Face verified successfully (Confidence: 92.45%)",
  "faces_detected": 1,
  "processing_time_ms": 1823
}
```

### 4. Check Registration

```http
POST /check-registration
Content-Type: application/json

{
  "employee_id": "uuid"
}
```

Response:
```json
{
  "registered": true,
  "message": "Face is registered"
}
```

### 5. Batch Register

```http
POST /batch-register
Content-Type: application/json

{
  "employees": [
    {
      "employee_id": "uuid1",
      "image": "base64_image1"
    },
    {
      "employee_id": "uuid2",
      "image": "base64_image2"
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "total": 2,
  "registered": 2,
  "failed": 0,
  "results": [...]
}
```

## Testing

### Test with cURL

```bash
# Health check
curl http://localhost:5000/health

# Register face (replace with actual base64 image)
curl -X POST http://localhost:5000/register-face \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "your-uuid",
    "image": "data:image/jpeg;base64,/9j/4AAQ..."
  }'
```

### Test with Python

```python
import requests
import base64

# Read image and convert to base64
with open('photo.jpg', 'rb') as f:
    image_base64 = base64.b64encode(f.read()).decode()

# Register face
response = requests.post('http://localhost:5000/register-face', json={
    'employee_id': 'your-uuid',
    'image': f'data:image/jpeg;base64,{image_base64}'
})

print(response.json())
```

## Performance Tuning

### Speed vs Accuracy

**For faster processing (recommended for production):**
```env
FACE_DETECTION_MODEL=hog
NUM_JITTERS=1
```

**For higher accuracy (if you have powerful CPU):**
```env
FACE_DETECTION_MODEL=cnn
NUM_JITTERS=2
```

### Confidence Threshold

- **80%**: Balanced (recommended)
- **85%**: Stricter (fewer false positives)
- **75%**: Lenient (fewer false negatives)

## Troubleshooting

### dlib installation fails

```bash
# Install build tools
sudo apt install build-essential cmake

# Try installing dlib separately
pip install dlib --verbose
```

### Out of memory errors

- Reduce `MAX_IMAGE_SIZE` to 800 or 512
- Use `FACE_DETECTION_MODEL=hog` instead of `cnn`
- Reduce `NUM_JITTERS` to 1

### Slow performance

- Use `hog` detection model (faster than `cnn`)
- Reduce image size before sending to API
- Consider using multiple worker processes with Gunicorn

### Face not detected

- Ensure good lighting in photos
- Face should be front-facing
- Minimum image size: 200x200 pixels
- Remove sunglasses, hats, or obstructions

## Security Considerations

- Face encodings are mathematical representations, not raw biometric data
- All API calls should be internal (not exposed to public internet)
- Use HTTPS in production
- Implement rate limiting
- Store photos securely in Supabase Storage
- Comply with local biometric data regulations

## Monitoring

### Check service status

```bash
# If running as systemd service
sudo systemctl status face-recognition

# Check logs
sudo journalctl -u face-recognition -f
```

### Monitor performance

```bash
# Check CPU usage
top -p $(pgrep -f "python app.py")

# Check memory usage
ps aux | grep "python app.py"
```

## Maintenance

### Update dependencies

```bash
pip install --upgrade -r requirements.txt
```

### Clean up old logs

```sql
-- Run in Supabase SQL Editor
SELECT cleanup_old_verification_logs();
```

### Backup face encodings

```sql
-- Export face encodings
COPY face_encodings TO '/tmp/face_encodings_backup.csv' CSV HEADER;
```

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u face-recognition -f`
2. Verify database connection
3. Test with sample images
4. Check system resources (RAM, CPU)

## License

Internal use only - Nexon Attendo
