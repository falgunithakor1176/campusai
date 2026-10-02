@echo off
:: Batch script to copy pgvector files with Administrator privileges
echo ============================================================
echo CampusAI - pgvector Local Installer
echo ============================================================
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERROR: This script must be run as Administrator.
    echo Please right-click this file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

set "SRC_DIR=C:\Users\FBT\.gemini\antigravity\scratch\campusai\pgvector-windows"
set "DST_DIR=C:\Program Files\PostgreSQL\16"

echo Copying vector.dll...
copy /Y "%SRC_DIR%\lib\vector.dll" "%DST_DIR%\lib\"
if %errorLevel% neq 0 goto ERROR

echo Copying extension files...
copy /Y "%SRC_DIR%\share\extension\*.*" "%DST_DIR%\share\extension\"
if %errorLevel% neq 0 goto ERROR

echo.
echo ✅ pgvector extension installed successfully!
echo.
pause
exit /b 0

:ERROR
echo.
echo ❌ ERROR: Copy failed. Please check your PostgreSQL installation path.
echo.
pause
exit /b 1
