#!/usr/bin/env python3
"""
Test script for Face Recognition ML Service
Run this after starting the service to verify it's working correctly
"""

import requests
import json
import base64
import os
from PIL import Image, ImageDraw
import io

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get('http://localhost:5000/health')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def create_test_image():
    """Create a simple test image with a face-like pattern"""
    # Create a 300x300 image with a simple face pattern
    img = Image.new('RGB', (300, 300), color='lightblue')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple face
    # Head (circle)
    draw.ellipse([50, 50, 250, 250], fill='peachpuff', outline='black', width=2)
    
    # Eyes
    draw.ellipse([80, 100, 120, 140], fill='white', outline='black', width=2)
    draw.ellipse([180, 100, 220, 140], fill='white', outline='black', width=2)
    draw.ellipse([90, 110, 110, 130], fill='black')  # Left pupil
    draw.ellipse([190, 110, 210, 130], fill='black')  # Right pupil
    
    # Nose
    draw.polygon([(150, 140), (140, 180), (160, 180)], fill='peachpuff', outline='black')
    
    # Mouth
    draw.arc([120, 180, 180, 220], 0, 180, fill='black', width=3)
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/jpeg;base64,{img_base64}"

def test_register_face():
    """Test face registration"""
    print("🔍 Testing face registration...")
    
    # Create test image
    test_image = create_test_image()
    test_employee_id = "test-employee-123"
    
    try:
        response = requests.post('http://localhost:5000/register-face', json={
            'employee_id': test_employee_id,
            'image': test_image
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Face registration passed: {data.get('message')}")
                print(f"   Faces detected: {data.get('faces_detected', 'N/A')}")
                return True, test_employee_id
            else:
                print(f"❌ Face registration failed: {data.get('message')}")
                return False, None
        else:
            print(f"❌ Face registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Face registration error: {e}")
        return False, None

def test_check_registration(employee_id):
    """Test checking if face is registered"""
    print("🔍 Testing registration check...")
    
    try:
        response = requests.post('http://localhost:5000/check-registration', json={
            'employee_id': employee_id
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('registered'):
                print(f"✅ Registration check passed: Face is registered")
                return True
            else:
                print(f"❌ Registration check failed: Face not registered")
                return False
        else:
            print(f"❌ Registration check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Registration check error: {e}")
        return False

def test_verify_face(employee_id):
    """Test face verification"""
    print("🔍 Testing face verification...")
    
    # Create another test image (slightly different)
    test_selfie = create_test_image()
    
    try:
        response = requests.post('http://localhost:5000/verify-face', json={
            'employee_id': employee_id,
            'selfie': test_selfie
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                verified = data.get('verified', False)
                confidence = data.get('confidence', 0)
                print(f"✅ Face verification completed")
                print(f"   Verified: {verified}")
                print(f"   Confidence: {confidence}%")
                return True
            else:
                print(f"❌ Face verification failed: {data.get('message')}")
                return False
        else:
            print(f"❌ Face verification failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Face verification error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Face Recognition ML Service Tests")
    print("=" * 50)
    
    # Test 1: Health Check
    if not test_health_check():
        print("\n❌ Service is not running or not accessible")
        print("Make sure to start the service with: python app.py")
        return
    
    print()
    
    # Test 2: Face Registration
    success, employee_id = test_register_face()
    if not success:
        print("\n❌ Face registration failed - check service logs")
        return
    
    print()
    
    # Test 3: Check Registration
    if not test_check_registration(employee_id):
        print("\n❌ Registration check failed")
        return
    
    print()
    
    # Test 4: Face Verification
    if not test_verify_face(employee_id):
        print("\n❌ Face verification failed")
        return
    
    print()
    print("🎉 All tests passed! Face Recognition ML Service is working correctly.")
    print("\nNext steps:")
    print("1. The service is ready to integrate with the main application")
    print("2. Upload real employee photos to test with actual faces")
    print("3. Configure the main application to use ML_SERVICE_URL=http://localhost:5000")

if __name__ == "__main__":
    main()