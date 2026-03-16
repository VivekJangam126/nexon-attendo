@echo off
echo 🚀 Setting up Face Recognition ML Service...
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

REM Install requirements
echo 📥 Installing dependencies (this may take 10-15 minutes)...
echo ⏳ Please wait while dlib compiles...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    echo.
    echo Try installing build tools:
    echo - Install Visual Studio Build Tools
    echo - Install CMake
    echo Then run this script again
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