@echo off
echo 🚀 Starting Advanced OpenCV Face Recognition Service...

REM Check if virtual environment exists
if not exist "venv" (
    echo ❌ Virtual environment not found!
    echo 📦 Please run setup-opencv-advanced.bat first
    pause
    exit /b 1
)

REM Check if face_storage directory exists
if not exist "face_storage" (
    echo 📁 Creating face_storage directory...
    mkdir face_storage
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if required packages are installed
echo 🔍 Checking OpenCV installation...
python -c "import cv2; print('✅ OpenCV version:', cv2.__version__)" 2>nul
if errorlevel 1 (
    echo ❌ OpenCV not installed properly!
    echo 📦 Please run setup-opencv-advanced.bat first
    pause
    exit /b 1
)

REM Start the advanced service
echo 🚀 Starting Advanced ML Service...
echo 📍 Service will be available at: http://localhost:5000
echo 🔧 Press Ctrl+C to stop the service
echo.
python app_opencv_advanced.py