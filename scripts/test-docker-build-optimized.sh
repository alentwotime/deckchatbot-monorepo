#!/bin/bash

# Test script to verify the optimized Docker build for the AI service
# This script builds the AI service Docker image with the optimized Dockerfile

set -e  # Exit on any error

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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_warning "This script may need to be run as root for some operations"
fi

# Function to check disk space
check_disk_space() {
    print_status "Checking disk space..."
    df -h /
}

# Function to clean Docker resources
clean_docker() {
    print_status "Cleaning Docker resources..."
    docker system prune -af --volumes || true
    print_success "Docker resources cleaned"
}

# Main function
main() {
    print_status "Starting optimized Docker build test..."
    
    # Check initial disk space
    print_status "Initial disk space:"
    check_disk_space
    
    # Clean Docker resources before building
    clean_docker
    
    # Build the AI service Docker image
    print_status "Building AI service Docker image..."
    cd "$(dirname "$0")/.." || exit 1
    
    # Use docker-compose to build only the AI service
    docker-compose -f docker/docker-compose.yml build ai-service
    
    # Check if build was successful
    if [ $? -eq 0 ]; then
        print_success "AI service Docker image built successfully!"
    else
        print_error "Failed to build AI service Docker image"
        exit 1
    fi
    
    # Check disk space after building
    print_status "Disk space after building:"
    check_disk_space
    
    # Print image size
    print_status "AI service Docker image size:"
    docker images | grep ai-service
    
    print_success "Optimized Docker build test completed successfully"
}

# Run the main function
main "$@"
