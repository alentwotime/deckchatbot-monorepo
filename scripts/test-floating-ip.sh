#!/bin/bash

# Test script to verify floating IP configuration
# This script checks if the floating IP is properly configured

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

FLOATING_IP="5.161.23.197"

print_status "Testing floating IP configuration for ${FLOATING_IP}..."

# Check if the IP is configured on eth0
if ip addr show eth0 | grep -q "${FLOATING_IP}"; then
    print_success "Floating IP ${FLOATING_IP} is configured on eth0"
else
    print_warning "Floating IP ${FLOATING_IP} is not found on eth0"
    print_status "Current eth0 configuration:"
    ip addr show eth0 || print_error "eth0 interface not found"
fi

# Test connectivity (if the IP is configured)
if ip addr show eth0 | grep -q "${FLOATING_IP}"; then
    print_status "Testing connectivity from floating IP..."
    # This would test if the IP is reachable (requires the IP to be actually assigned by the provider)
    ping -c 1 -I "${FLOATING_IP}" 8.8.8.8 >/dev/null 2>&1 && print_success "Connectivity test passed" || print_warning "Connectivity test failed (this may be normal if IP is not yet active)"
fi

print_status "Floating IP test completed"
