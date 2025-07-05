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

# Function to simulate apt lock
simulate_apt_lock() {
    print_status "Simulating apt lock by starting a long-running apt process..."

    # Start a sleep process that pretends to be apt
    apt-get update > /dev/null 2>&1 &
    APT_PID=$!

    # Verify the process is running
    if ps -p $APT_PID > /dev/null; then
        print_success "Simulated apt process started with PID: $APT_PID"
    else
        print_error "Failed to start simulated apt process"
        return 1
    fi

    # Wait a moment to ensure lock files are created
    sleep 2

    # Check if lock files exist
    if [ -f /var/lib/apt/lists/lock ] || [ -f /var/lib/dpkg/lock ]; then
        print_success "Apt lock files detected"
    else
        print_warning "No apt lock files detected. The simulation may not be accurate."
    fi

    return 0
}

# Function to clean up apt lock simulation
cleanup_apt_lock() {
    if [ -n "$APT_PID" ] && ps -p $APT_PID > /dev/null; then
        print_status "Terminating simulated apt process (PID: $APT_PID)..."
        kill $APT_PID
        wait $APT_PID 2>/dev/null || true
        print_success "Simulated apt process terminated"
    fi
}

# Main test function
run_test() {
    print_status "Starting disk space test..."

    # Show current disk space
    print_status "Current disk space:"
    df -h /

    # Ask which test to run
    echo ""
    echo "Select test to run:"
    echo "1. Low disk space test"
    echo "2. Apt lock test"
    echo "3. Combined test (low disk space + apt lock)"
    read -p "Enter your choice (1-3): " test_choice

    case $test_choice in
        1)
            # Fill disk space to leave only 100MB free
            fill_disk_space 100

            print_status "Disk space filled. Now running deploy-azure.sh..."

            # Run deploy-azure.sh with a flag to indicate test mode
            # This is just a simulation - we don't actually run the script
            print_status "In a real test, we would run: ./deploy-azure.sh --test-mode"

            # Instead, we'll just show what would happen
            print_status "The script should detect low disk space and perform cleanup"
            ;;
        2)
            # Simulate apt lock
            simulate_apt_lock

            print_status "Apt lock simulated. Now running deploy-azure.sh..."

            # Run deploy-azure.sh with a flag to indicate test mode
            # This is just a simulation - we don't actually run the script
            print_status "In a real test, we would run: ./deploy-azure.sh --test-mode"

            # Instead, we'll just show what would happen
            print_status "The script should detect apt lock and wait or provide options"

            # Clean up apt lock after a delay
            print_status "Waiting 10 seconds before cleaning up apt lock..."
            sleep 10
            cleanup_apt_lock
            ;;
        3)
            # Fill disk space to leave only 100MB free
            fill_disk_space 100

            # Simulate apt lock
            simulate_apt_lock

            print_status "Disk space filled and apt lock simulated. Now running deploy-azure.sh..."

            # Run deploy-azure.sh with a flag to indicate test mode
            # This is just a simulation - we don't actually run the script
            print_status "In a real test, we would run: ./deploy-azure.sh --test-mode"

            # Instead, we'll just show what would happen
            print_status "The script should detect both low disk space and apt lock"
            print_status "It should wait for apt to finish before attempting cleanup"

            # Clean up apt lock after a delay
            print_status "Waiting 10 seconds before cleaning up apt lock..."
            sleep 10
            cleanup_apt_lock
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac

    # Clean up after test
    cleanup_test

    print_success "Test completed. System restored to original state."
}

# Function to clean up everything
cleanup_all() {
    cleanup_apt_lock
    cleanup_test
}

# Trap to ensure cleanup even if script is interrupted
trap cleanup_all EXIT INT TERM

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
