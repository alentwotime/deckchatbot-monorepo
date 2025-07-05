#!/bin/bash

# Test script to simulate low disk space scenarios for deploy-azure.sh
# This script is for testing purposes only and should be run in a controlled environment

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
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Function to create a large file to fill disk space
fill_disk_space() {
    local target_free_mb=$1
    local mount_point=${2:-"/"}
    
    print_status "Filling disk space to leave only ${target_free_mb}MB free..."
    
    # Get current free space in MB
    local current_free=$(df -m $mount_point | awk 'NR==2 {print $4}')
    
    # Calculate how much space to fill
    local fill_size=$((current_free - target_free_mb))
    
    if [ $fill_size -le 0 ]; then
        print_warning "Already have less than ${target_free_mb}MB free. No need to fill disk."
        return
    fi
    
    print_status "Creating a ${fill_size}MB file to simulate low disk space..."
    
    # Create a temporary file of the calculated size
    dd if=/dev/zero of=/tmp/fill_disk_test bs=1M count=$fill_size
    
    # Verify current free space
    df -h $mount_point
}

# Function to clean up the test
cleanup_test() {
    print_status "Cleaning up test files..."
    rm -f /tmp/fill_disk_test
    df -h /
}

# Main test function
run_test() {
    print_status "Starting disk space test..."
    
    # Show current disk space
    print_status "Current disk space:"
    df -h /
    
    # Fill disk space to leave only 100MB free
    fill_disk_space 100
    
    print_status "Disk space filled. Now running deploy-azure.sh..."
    
    # Run deploy-azure.sh with a flag to indicate test mode
    # This is just a simulation - we don't actually run the script
    print_status "In a real test, we would run: ./deploy-azure.sh --test-mode"
    
    # Instead, we'll just show what would happen
    print_status "The script should detect low disk space and perform cleanup"
    
    # Clean up after test
    cleanup_test
    
    print_success "Test completed. Disk space restored."
}

# Trap to ensure cleanup even if script is interrupted
trap cleanup_test EXIT

# Show warning and ask for confirmation
print_warning "This script will temporarily fill your disk to test low disk space handling."
print_warning "It should clean up after itself, but use with caution."
read -p "Do you want to proceed? (y/n): " confirm

if [[ $confirm == "y" || $confirm == "Y" ]]; then
    run_test
else
    print_status "Test cancelled."
    exit 0
fi
