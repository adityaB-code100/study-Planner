#!/bin/bash

# Build script for Smart Study Planner
# This script builds the React frontend and prepares for deployment

echo "🚀 Building Smart Study Planner..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build React app
echo "🔨 Building React app..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ React build successful!"
    echo "📁 Build files are in the 'build' directory"
else
    echo "❌ Build failed! Please check for errors."
    exit 1
fi

echo "✅ Build complete! Ready for deployment."

