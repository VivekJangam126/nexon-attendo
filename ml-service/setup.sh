#!/bin/bash

echo "🚀 Setting up Face Recognition ML Service..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    echo "Please install Python 3.8+ first"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "❌ Failed to create virtual environment"
    exit 1
fi

echo "✅ Virtual environment created"
echo

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing dependencies (this may take 10-15 minutes)..."
echo "⏳ Please wait while dlib compiles..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    echo
    echo "Try installing build tools:"
    echo "Ubuntu/Debian: sudo apt install build-essential cmake"
    echo "macOS: brew install cmake"
    echo "Then run this script again"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found"
    echo "Please create .env file with your Supabase credentials"
    echo "See .env.example for reference"
fi

echo "🎉 Setup complete!"
echo
echo "Next steps:"
echo "1. Make sure .env file is configured"
echo "2. Run: python app.py"
echo "3. Test with: python test_service.py"
echo