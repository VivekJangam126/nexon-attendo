@echo off
echo 🚀 Setting up Deep Learning Face Recognition Service...
echo.

echo 📦 Installing deep learning requirements...
pip install -r requirements-deeplearning.txt

echo.
echo ✅ Deep learning setup complete!
echo.
echo 🧠 Models included:
echo   - MTCNN: Multi-task CNN for face detection
echo   - FaceNet: InceptionResnetV1 for face embeddings
echo   - Pretrained on VGGFace2 dataset
echo.
echo 🚀 To start the service:
echo   python app_deeplearning.py
echo.
pause