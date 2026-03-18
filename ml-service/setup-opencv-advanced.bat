@echo off
echo 🚀 Setting up Advanced OpenCV Face Recognition Service...

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo 📥 Installing requirements...
pip install -r requirements-opencv-advanced.txt

REM Create face storage directory
if not exist "face_storage" (
    echo 📁 Creating face storage directory...
    mkdir face_storage
)

echo ✅ Setup complete!
echo 🚀 To start the service, run: python app_opencv_advanced.py
echo 🔍 Service will be available at: http://localhost:5000
pause