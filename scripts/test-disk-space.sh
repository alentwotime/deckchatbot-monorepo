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
    local stuck_mode=${1:-"normal"}

    print_status "Simulating apt lock by starting a long-running apt process..."

    if [ "$stuck_mode" = "normal" ]; then
        # Start a real apt-get update process (will finish normally)
        apt-get update > /dev/null 2>&1 &
        APT_PID=$!
    elif [ "$stuck_mode" = "stuck" ]; then
        # Create a fake apt process that will appear stuck
        # This creates a process with "apt-get" in its name that will run for a long time
        bash -c "echo 'Simulating stuck apt process'; while true; do sleep 10; done" &
        FAKE_PID=$!
        # Rename the process to look like apt-get
        if command -v prips >/dev/null 2>&1; then
            # If prips is available, use it to rename the process
            prips -n "apt-get update (stuck simulation)" $FAKE_PID >/dev/null 2>&1 || true
        fi
        APT_PID=$FAKE_PID

        # Create fake lock files to simulate a stuck apt process
        touch /var/lib/apt/lists/lock
        touch /var/lib/dpkg/lock

        print_warning "Created a simulated stuck apt process that will never complete"
    elif [ "$stuck_mode" = "zombie" ]; then
        # Create a zombie process that appears to be apt
        bash -c "echo 'Simulating zombie apt process'; sleep 1; kill -STOP \$\$" &
        ZOMBIE_PID=$!
        sleep 2  # Give time for the process to become a zombie

        # Create fake lock files
        touch /var/lib/apt/lists/lock
        touch /var/lib/dpkg/lock

        APT_PID=$ZOMBIE_PID
        print_warning "Created a simulated zombie apt process"
    elif [ "$stuck_mode" = "resistant" ]; then
        # Create a process that ignores SIGTERM (resistant to normal termination)
        # but can still be killed with SIGKILL
        print_status "Creating a process that ignores SIGTERM signals..."

        # Create a bash script that traps and ignores SIGTERM
        cat > /tmp/resistant_process.sh << 'EOF'
#!/bin/bash
# Trap SIGTERM and ignore it
trap "echo 'Ignoring SIGTERM signal'; echo 'Send SIGKILL to terminate me'" TERM
echo "Starting resistant process (PID: $$)"
echo "This process ignores SIGTERM and can only be killed with SIGKILL"
# Simulate apt-get process
echo "apt-get update running..."
# Create and hold lock files
touch /var/lib/dpkg/lock
exec {lock_fd}>/var/lib/dpkg/lock
flock -x $lock_fd
echo "Lock acquired on /var/lib/dpkg/lock"
# Loop forever
while true; do
    sleep 10
done
EOF
        chmod +x /tmp/resistant_process.sh

        # Start the resistant process
        /tmp/resistant_process.sh &
        RESISTANT_PID=$!
        APT_PID=$RESISTANT_PID

        # Wait a moment to ensure lock files are created and held
        sleep 2

        print_warning "Created a simulated apt process that resists normal termination (PID: $APT_PID)"
        print_warning "This process will ignore SIGTERM and can only be killed with SIGKILL"
    fi

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
    echo "2. Normal apt lock test (will complete naturally)"
    echo "3. Stuck apt lock test (will never complete)"
    echo "4. Zombie apt process test"
    echo "5. Termination-resistant apt process test"
    echo "6. Combined test (low disk space + stuck apt lock)"
    read -p "Enter your choice (1-6): " test_choice

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
            # Simulate normal apt lock (will complete naturally)
            simulate_apt_lock "normal"

            print_status "Normal apt lock simulated. Now running deploy-azure.sh..."

            # Run deploy-azure.sh with a flag to indicate test mode
            # This is just a simulation - we don't actually run the script
            print_status "In a real test, we would run: ./deploy-azure.sh --test-mode"

            # Instead, we'll just show what would happen
            print_status "The script should detect apt lock and wait until it completes naturally"

            # Clean up apt lock after a delay
            print_status "Waiting 10 seconds before cleaning up apt lock..."
            sleep 10
            cleanup_apt_lock
            ;;
        3)
            # Simulate stuck apt lock (will never complete)
            simulate_apt_lock "stuck"

            print_status "Stuck apt lock simulated. Now running deploy-azure.sh..."

            # Run deploy-azure.sh with a flag to indicate test mode
            # This is just a simulation - we don't actually run the script
            print_status "In a real test, we would run: ./deploy-azure.sh --test-mode"

            # Instead, we'll just show what would happen
            print_status "The script should detect that the apt process is stuck after 60 seconds of inactivity"
            print_status "It should then provide interactive options to resolve the situation"

            # Clean up apt lock after a delay
            print_status "Waiting 10 seconds before cleaning up apt lock..."
            sleep 10
            cleanup_apt_lock
            ;;
        4)
            # Simulate zombie apt process
            simulate_apt_lock "zombie"

            print_status "Zombie apt process simulated. Now running deploy-azure.sh..."

            # Run deploy-azure.sh with a flag to indicate test mode
            # This is just a simulation - we don't actually run the script
            print_status "In a real test, we would run: ./deploy-azure.sh --test-mode"

            # Instead, we'll just show what would happen
            print_status "The script should detect a zombie process and offer recovery options"
            print_status "The 'Try to fix apt' option should detect and fix the zombie process"

            # Clean up apt lock after a delay
            print_status "Waiting 10 seconds before cleaning up apt lock..."
            sleep 10
            cleanup_apt_lock
            ;;
        5)
            # Simulate termination-resistant apt process
            simulate_apt_lock "resistant"

            print_status "Termination-resistant apt process simulated. Now running deploy-azure.sh..."

            # Run deploy-azure.sh with a flag to indicate test mode
            # This is just a simulation - we don't actually run the script
            print_status "In a real test, we would run: ./deploy-azure.sh --test-mode"

            # Instead, we'll just show what would happen
            print_status "The script should detect the process and offer termination options"
            print_status "The normal termination should fail, requiring force kill"

            # Clean up apt lock after a delay
            print_status "Waiting 15 seconds before cleaning up apt lock..."
            sleep 15
            print_status "Force killing resistant process..."
            if [ -n "$APT_PID" ] && ps -p $APT_PID > /dev/null; then
                kill -9 $APT_PID
                print_success "Process $APT_PID has been force killed."
            fi
            cleanup_apt_lock
            # Remove the temporary script
            rm -f /tmp/resistant_process.sh
            ;;
        6)
            # Fill disk space to leave only 100MB free
            fill_disk_space 100

            # Simulate stuck apt lock
            simulate_apt_lock "stuck"

            print_status "Disk space filled and stuck apt lock simulated. Now running deploy-azure.sh..."

            # Run deploy-azure.sh with a flag to indicate test mode
            # This is just a simulation - we don't actually run the script
            print_status "In a real test, we would run: ./deploy-azure.sh --test-mode"

            # Instead, we'll just show what would happen
            print_status "The script should detect both low disk space and stuck apt lock"
            print_status "It should detect the stuck process after 60 seconds and provide interactive options"
            print_status "If the user chooses to proceed, it should skip apt operations during cleanup"

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
    print_status "Performing cleanup..."

    # Clean up apt lock first
    cleanup_apt_lock

    # Then clean up disk space test
    cleanup_test

    # Remove any stale lock files that might have been created
    if [ -f /var/lib/apt/lists/lock ] || [ -f /var/lib/dpkg/lock ] || [ -f /var/lib/dpkg/lock-frontend ] || [ -f /var/cache/apt/archives/lock ]; then
        print_status "Removing stale lock files..."
        rm -f /var/lib/apt/lists/lock /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend /var/cache/apt/archives/lock
    fi

    # Remove temporary script file if it exists
    if [ -f /tmp/resistant_process.sh ]; then
        print_status "Removing temporary script file..."
        rm -f /tmp/resistant_process.sh
    fi

    print_success "Cleanup completed. System restored to original state."
}

# Trap to ensure cleanup even if script is interrupted
trap cleanup_all EXIT INT TERM

# Print warning if script is interrupted
trap 'echo -e "\n${YELLOW}Script interrupted. Cleaning up...${NC}"' INT

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
