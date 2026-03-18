@echo off
echo 🚀 Starting Fast Accurate Face Recognition ML Service...
echo.
echo ⚡ Optimized for speed while maintaining high accuracy
echo 📸 Smart photo selection from 50 photos
echo 🎯 Sub-30 second processing time
echo 🧠 85%% confidence threshold
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo 📋 Installing requirements...
pip install -r requirements-fast-accurate.txt

REM Start the service
echo.
echo 🎉 Starting Fast Accurate ML Service on http://localhost:5000
echo 📊 Health check: http://localhost:5000/health
echo 🔍 Debug info: http://localhost:5000/debug
echo.
python app_fast_accurate.py

pause