@echo off
echo 🚀 Setting up Face Recognition ML Service (Windows Alternative)...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Create virtual environment
echo 📦 Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ❌ Failed to create virtual environment
    pause
    exit /b 1
)

echo ✅ Virtual environment created
echo.

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Try installing dlib from pre-compiled wheel first
echo 📥 Installing dlib (trying pre-compiled version)...
pip install https://github.com/z-mahmud22/Dlib_Windows_Python3.x/raw/main/dlib-19.24.0-cp311-cp311-win_amd64.whl
if %errorlevel% neq 0 (
    echo ⚠️  Pre-compiled dlib failed, trying pip install...
    pip install dlib
    if %errorlevel% neq 0 (
        echo ❌ dlib installation failed
        echo Please install Visual Studio Build Tools and try again
        pause
        exit /b 1
    )
)

echo ✅ dlib installed successfully
echo.

REM Install other dependencies
echo 📥 Installing other dependencies...
pip install flask==3.0.0 flask-cors==4.0.0 opencv-python==4.8.1.78 face-recognition==1.3.0 numpy==1.24.3 Pillow==10.1.0 python-dotenv==1.0.0 psycopg2-binary==2.9.9 requests==2.31.0

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found
    echo Please create .env file with your Supabase credentials
    echo See .env.example for reference
    pause
)

echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Make sure .env file is configured
echo 2. Run: python app.py
echo 3. Test with: python test_service.py
echo.
pause