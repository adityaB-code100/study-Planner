@echo off
REM Build script for Smart Study Planner (Windows)
REM This script builds the React frontend and prepares for deployment

echo 🚀 Building Smart Study Planner...

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
call npm install

REM Build React app
echo 🔨 Building React app...
call npm run build

REM Check if build was successful
if exist "build" (
    echo ✅ React build successful!
    echo 📁 Build files are in the 'build' directory
) else (
    echo ❌ Build failed! Please check for errors.
    exit /b 1
)

echo ✅ Build complete! Ready for deployment.

