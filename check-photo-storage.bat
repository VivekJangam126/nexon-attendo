@echo off
echo ========================================
echo CHECKING FACE PHOTO STORAGE
echo ========================================
echo.

echo Current directory: %cd%
echo.

echo Checking ML service face storage directory...
if exist "ml-service\face_storage" (
    echo ✅ Face storage directory exists
    echo.
    echo 📁 Employee folders:
    dir "ml-service\face_storage" /AD /B
    echo.
    
    echo 📊 Detailed storage info:
    for /d %%i in ("ml-service\face_storage\*") do (
        echo.
        echo 👤 Employee: %%~ni
        echo    📁 Folder: %%i
        if exist "%%i\*.jpg" (
            echo    📸 Photos:
            dir "%%i\*.jpg" /B
        ) else (
            echo    ❌ No photos found
        )
        if exist "%%i\features.pkl" (
            echo    ✅ Features file exists
        ) else (
            echo    ❌ No features file
        )
        if exist "%%i\metadata.json" (
            echo    ✅ Metadata file exists
        ) else (
            echo    ❌ No metadata file
        )
    )
) else (
    echo ❌ Face storage directory does not exist
    echo Creating directory...
    mkdir "ml-service\face_storage"
)

echo.
echo ========================================
echo CHECKING ML SERVICE STATUS
echo ========================================
echo.

curl -s http://localhost:5000/stats 2>nul || echo ❌ ML service not running on localhost:5000

echo.
echo ========================================
echo DONE
echo ========================================
pause