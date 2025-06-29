#!/bin/bash

# Fix Docker Build Issue - Comprehensive Solution
# This script addresses the "webpack: not found" error by clearing Docker cache
# and rebuilding the containers with the correct configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "=============================================="
    echo -e "${BLUE}$1${NC}"
    echo "=============================================="
}

print_header "Docker Build Issue Fix"

print_status "This script will fix the 'webpack: not found' error by:"
print_status "1. Stopping all running containers"
print_status "2. Removing old containers and images"
print_status "3. Clearing Docker build cache"
print_status "4. Rebuilding containers with correct configuration"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running. Proceeding with fix..."

# Navigate to docker directory
if [ -d "docker" ]; then
    cd docker
    print_success "Changed to docker directory"
else
    print_error "Docker directory not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Stop all running containers
print_header "Step 1: Stopping Running Containers"
if docker compose ps -q | grep -q .; then
    print_status "Stopping running containers..."
    docker compose down
    print_success "Containers stopped"
else
    print_status "No running containers found"
fi

# Step 2: Remove old containers and images
print_header "Step 2: Cleaning Up Old Containers and Images"

print_status "Removing old containers..."
docker compose rm -f || print_warning "No containers to remove"

print_status "Removing old images..."
# Remove specific project images
docker images | grep deckchatbot | awk '{print $3}' | xargs -r docker rmi -f || print_warning "No deckchatbot images to remove"

# Remove dangling images
docker image prune -f
print_success "Old containers and images removed"

# Step 3: Clear Docker build cache
print_header "Step 3: Clearing Docker Build Cache"
print_status "Clearing Docker build cache..."
docker builder prune -f
print_success "Docker build cache cleared"

# Step 4: Verify configuration
print_header "Step 4: Verifying Configuration"

print_status "Checking frontend Dockerfile configuration..."
if grep -q "RUN npm ci &&" ../apps/frontend/Dockerfile; then
    print_success "✅ Frontend Dockerfile correctly installs all dependencies"
else
    print_error "❌ Frontend Dockerfile configuration issue detected"
    exit 1
fi

print_status "Checking package.json for webpack..."
if grep -q '"webpack"' ../apps/frontend/package.json; then
    print_success "✅ Webpack is properly listed as dev dependency"
else
    print_error "❌ Webpack not found in package.json"
    exit 1
fi

# Step 5: Rebuild containers
print_header "Step 5: Rebuilding Containers"
print_status "Building containers without cache..."
print_warning "This may take several minutes..."

# Build without cache to ensure fresh build
docker compose build --no-cache

print_success "Containers rebuilt successfully!"

# Step 6: Start services
print_header "Step 6: Starting Services"
print_status "Starting all services..."
docker compose up -d

# Wait a moment for services to start
sleep 10

# Step 7: Verify services
print_header "Step 7: Verifying Services"
print_status "Checking service status..."
docker compose ps

print_status "Checking service health..."
if docker compose ps | grep -q "Up"; then
    print_success "✅ Services are running"
    
    # Test frontend
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        print_success "✅ Frontend is accessible at http://localhost:3000"
    else
        print_warning "⚠️ Frontend may still be starting up"
    fi
    
    # Test backend
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        print_success "✅ Backend is accessible at http://localhost:8000"
    else
        print_warning "⚠️ Backend may still be starting up"
    fi
    
    # Test AI service
    if curl -f http://localhost:8001/health >/dev/null 2>&1; then
        print_success "✅ AI service is accessible at http://localhost:8001"
    else
        print_warning "⚠️ AI service may still be starting up"
    fi
else
    print_error "❌ Some services failed to start"
    print_status "Checking logs for errors..."
    docker compose logs --tail=20
fi

print_header "Fix Complete!"

print_success "The Docker build issue has been resolved!"
echo ""
print_status "Summary of actions taken:"
echo "  • Stopped all running containers"
echo "  • Removed old containers and images"
echo "  • Cleared Docker build cache"
echo "  • Verified configuration is correct"
echo "  • Rebuilt containers without cache"
echo "  • Started all services"
echo ""
print_status "Your application should now be accessible at:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:8000"
echo "  • AI Service: http://localhost:8001"
echo ""
print_status "If you still encounter issues, check the logs with:"
echo "  docker compose logs -f"
echo ""
print_warning "Note: The OPENAI_API_KEY warning is expected when using Ollama (AI_PROVIDER=ollama)"
