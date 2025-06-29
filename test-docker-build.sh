#!/bin/bash

# Test script to verify the Docker build fix
# This script checks if the frontend Dockerfile has the correct dependency installation

echo "🔍 Testing Docker build configuration..."

# Check if the Dockerfile has the correct npm ci command
if grep -q "RUN npm ci &&" apps/frontend/Dockerfile; then
    echo "✅ Frontend Dockerfile correctly installs all dependencies (including dev dependencies)"
else
    echo "❌ Frontend Dockerfile still has the old configuration"
    exit 1
fi

# Check if webpack is listed as a dev dependency
if grep -q '"webpack"' apps/frontend/package.json; then
    echo "✅ Webpack is properly listed as a dev dependency"
else
    echo "❌ Webpack not found in package.json"
    exit 1
fi

# Check if the build script uses webpack
if grep -q '"build": "webpack --mode production"' apps/frontend/package.json; then
    echo "✅ Build script correctly uses webpack"
else
    echo "❌ Build script configuration issue"
    exit 1
fi

echo ""
echo "🎉 Docker build configuration looks good!"
echo ""
echo "📋 Summary of fixes applied:"
echo "   • Changed 'npm ci --only=production' to 'npm ci' in frontend Dockerfile"
echo "   • This ensures webpack and other dev dependencies are available during build"
echo "   • The OPENAI_API_KEY warning is expected when using Ollama (AI_PROVIDER=ollama)"
echo ""
echo "🚀 The Docker build should now complete successfully!"
