@echo off
echo 🚀 Starting Burst Mode Accurate Face Recognition Service...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/upgrade requirements
echo 📥 Installing requirements...
pip install -r requirements-burst-accurate.txt
if errorlevel 1 (
    echo ❌ Failed to install requirements
    pause
    exit /b 1
)

REM Create face storage directory
if not exist "face_storage" (
    echo 📁 Creating face storage directory...
    mkdir face_storage
)

echo.
echo ✅ Setup complete!
echo 🚀 Starting Burst Mode Accurate Face Recognition Service...
echo 📍 Service will be available at: http://localhost:5000
echo 📸 Optimized for 50+ photo burst registration
echo 🎯 85%% confidence threshold for high accuracy
echo.
echo Press Ctrl+C to stop the service
echo.

REM Start the service
python app_burst_accurate.py