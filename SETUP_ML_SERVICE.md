# Face Recognition ML Service Setup Guide

## Quick Setup (30 minutes)

### Step 1: Database Setup (5 minutes)

1. **Run the database migration**:
   - Open Supabase SQL Editor
   - Copy and paste the contents of `supabase/migrations/face_recognition_schema.sql`
   - Execute the SQL
   - Verify tables are created: `face_encodings`, `face_verification_logs`

### Step 2: Install Python Dependencies (15 minutes)

```bash
# Navigate to ML service directory
cd nexon-attendo/ml-service

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies (this may take 10-15 minutes)
pip install -r requirements.txt
```

**Note**: The `dlib` library compilation may take several minutes. This is normal.

### Step 3: Start the ML Service (2 minutes)

```bash
# Make sure you're in nexon-attendo/ml-service directory
# and virtual environment is activated

# Start the service
python app.py
```

You should see:
```
🚀 Starting Face Recognition ML Service...
📍 Host: 0.0.0.0
🔌 Port: 5000
🔍 Detection Model: hog
🎯 Confidence Threshold: 80.0%
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://[your-ip]:5000
```

### Step 4: Test the Service (3 minutes)

Open a new terminal and test:

```bash
# Test health check
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "face-recognition-ml",
#   "version": "1.0.0"
# }
```

### Step 5: Update Frontend Configuration (5 minutes)

The frontend needs to know where the ML service is running. Update the main application to use the ML service:

1. **Add ML service URL to main .env**:
   ```env
   # Add this line to nexon-attendo/.env
   ML_SERVICE_URL=http://localhost:5000
   ```

2. **The frontend will automatically detect the ML service and enable face recognition features**

## What Happens After Setup

### 1. Profile Photo Upload Integration
- When employees upload profile photos, the system will automatically register their face
- Face encodings are stored securely in the database
- Profile shows "Face Recognition Active" status

### 2. Attendance Verification
- During attendance marking, employees can use face verification
- System compares live selfie with registered face encoding
- High accuracy verification (80%+ confidence by default)

### 3. Admin Features
- Admins can see which employees have face recognition enabled
- Verification logs for audit trail
- Batch registration for multiple employees

## Troubleshooting

### Installation Issues

**dlib fails to install**:
```bash
# On Ubuntu/Debian:
sudo apt update
sudo apt install build-essential cmake

# On macOS:
brew install cmake

# Then retry:
pip install dlib
```

**Memory issues during installation**:
```bash
# Use fewer CPU cores for compilation
pip install dlib --install-option="--no-cache-dir"
```

### Runtime Issues

**Service won't start**:
1. Check if port 5000 is available: `netstat -an | grep 5000`
2. Try a different port in `.env`: `ML_SERVICE_PORT=5001`
3. Check Python version: `python --version` (needs 3.8+)

**Face detection not working**:
1. Ensure good lighting in photos
2. Face should be front-facing and clearly visible
3. Try adjusting confidence threshold in `.env`

### Performance Optimization

**For faster processing**:
```env
FACE_DETECTION_MODEL=hog
NUM_JITTERS=1
MAX_IMAGE_SIZE=800
```

**For higher accuracy**:
```env
FACE_DETECTION_MODEL=cnn
NUM_JITTERS=2
FACE_CONFIDENCE_THRESHOLD=85.0
```

## Production Deployment

### Option 1: Run as Background Service

Create systemd service file `/etc/systemd/system/face-recognition.service`:

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

### Option 2: Docker Deployment

```bash
cd nexon-attendo/ml-service
docker build -t face-recognition-ml .
docker run -d -p 5000:5000 --env-file .env face-recognition-ml
```

### Option 3: Cloud Deployment

Deploy to cloud platforms like:
- **Railway**: Easy Python deployment
- **Heroku**: Free tier available
- **DigitalOcean App Platform**: Managed deployment
- **AWS EC2**: Full control

## Security Considerations

1. **Network Security**:
   - Run ML service on internal network only
   - Use HTTPS in production
   - Implement rate limiting

2. **Data Privacy**:
   - Face encodings are mathematical representations, not raw biometric data
   - Comply with local biometric data regulations
   - Implement data retention policies

3. **Access Control**:
   - ML service should only be accessible by main application
   - Use API keys or authentication in production
   - Monitor access logs

## Monitoring

### Check Service Status
```bash
# If running as systemd service
sudo systemctl status face-recognition

# Check logs
sudo journalctl -u face-recognition -f

# Check process
ps aux | grep "python app.py"
```

### Performance Monitoring
```bash
# CPU usage
top -p $(pgrep -f "python app.py")

# Memory usage
free -h

# Disk space
df -h
```

### Database Monitoring
```sql
-- Check face registrations
SELECT COUNT(*) as registered_faces FROM face_encodings;

-- Check recent verifications
SELECT verification_status, COUNT(*) 
FROM face_verification_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY verification_status;

-- Check average processing time
SELECT AVG(processing_time_ms) as avg_processing_time_ms
FROM face_verification_logs 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

## Next Steps After Setup

1. **Test with real photos**: Upload employee photos and test face verification
2. **Adjust confidence threshold**: Based on your accuracy requirements
3. **Train employees**: Show them how to use face verification for attendance
4. **Monitor performance**: Check processing times and accuracy
5. **Set up monitoring**: Implement health checks and alerting

## Support

If you encounter issues:

1. **Check logs**: Look at ML service console output
2. **Test API endpoints**: Use curl or Postman to test individual endpoints
3. **Verify database**: Check if tables and data are created correctly
4. **Check network**: Ensure ML service is accessible from main application

The ML service is designed to be robust and handle various edge cases, but proper setup and monitoring ensure optimal performance.