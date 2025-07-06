#!/bin/bash

# Dependency Installation Script
# This script installs all commonly missing npm packages

echo "🔧 Installing Missing Dependencies..."
echo "=================================="

# Navigate to backend directory
if [ -d "apps/backend" ]; then
    cd apps/backend
    echo "📁 Changed to apps/backend directory"
elif [ -f "package.json" ]; then
    echo "📁 Using current directory (package.json found)"
else
    echo "❌ Error: Cannot find backend directory or package.json"
    echo "   Please run this script from the project root or backend directory"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in current directory"
    exit 1
fi

echo "📦 Current package.json location: $(pwd)/package.json"

# Install critical missing packages
echo ""
echo "🚀 Installing critical packages..."

# Core packages that are commonly missing
CRITICAL_PACKAGES=(
    "axios@^1.6.0"
    "multer@^1.4.5" 
    "cors@^2.8.5"
    "helmet@^7.0.0"
    "morgan@^1.10.0"
    "dotenv@^16.3.1"
)

# Install critical packages
for package in "${CRITICAL_PACKAGES[@]}"; do
    echo "📦 Installing $package..."
    npm install "$package"
    if [ $? -eq 0 ]; then
        echo "✅ Successfully installed $package"
    else
        echo "❌ Failed to install $package"
    fi
done

echo ""
echo "🔧 Installing additional common packages..."

# Additional commonly used packages
ADDITIONAL_PACKAGES=(
    "bcrypt@^5.1.1"
    "jsonwebtoken@^9.0.2"
    "express-rate-limit@^6.10.0"
    "express-slow-down@^1.6.0"
    "body-parser@^1.20.2"
    "cookie-parser@^1.4.6"
    "uuid@^9.0.1"
    "validator@^13.11.0"
)

# Install additional packages
for package in "${ADDITIONAL_PACKAGES[@]}"; do
    echo "📦 Installing $package..."
    npm install "$package"
    if [ $? -eq 0 ]; then
        echo "✅ Successfully installed $package"
    else
        echo "⚠️  Warning: Failed to install $package (may not be needed)"
    fi
done

echo ""
echo "🧹 Cleaning up..."
npm audit fix --force 2>/dev/null || echo "⚠️  Audit fix skipped"

echo ""
echo "📋 Installation Summary:"
echo "========================"

# Check if critical packages are now installed
echo "Checking critical packages..."
for package in "axios" "multer" "cors" "helmet" "morgan" "dotenv"; do
    if npm list "$package" >/dev/null 2>&1; then
        echo "✅ $package - INSTALLED"
    else
        echo "❌ $package - MISSING"
    fi
done

echo ""
echo "📦 Final package.json dependencies:"
if command -v jq >/dev/null 2>&1; then
    jq '.dependencies' package.json
else
    echo "Dependencies section:"
    grep -A 20 '"dependencies"' package.json | head -20
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo "1. Rebuild Docker container:"
echo "   cd ../../docker"
echo "   docker-compose build backend"
echo ""
echo "2. Start services:"
echo "   docker-compose up -d"
echo ""
echo "3. Check backend logs:"
echo "   docker-compose logs backend"
echo ""
echo "4. Test backend health:"
echo "   curl http://localhost:3000/health"

echo ""
echo "✅ Dependency installation complete!"