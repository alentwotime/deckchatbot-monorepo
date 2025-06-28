#!/bin/bash

# Pre-Deployment Verification Script for DeckChatbot
# This script checks if everything is ready for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="178.156.163.36"
DOMAIN_NAME="AlensDeckBot.online"
GITHUB_USER="aklin"
REPO_NAME="deckchatbot-monorepo"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_header() {
    echo ""
    echo "=============================================="
    echo -e "${BLUE}$1${NC}"
    echo "=============================================="
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Initialize counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

print_header "DeckChatbot Pre-Deployment Verification"
echo "Server: ${SERVER_IP}"
echo "Domain: ${DOMAIN_NAME}"
echo ""

# Check 1: DNS Configuration
print_header "1. DNS Configuration Check"

print_status "Checking DNS resolution for ${DOMAIN_NAME}..."
if nslookup ${DOMAIN_NAME} >/dev/null 2>&1; then
    RESOLVED_IP=$(nslookup ${DOMAIN_NAME} | grep -A1 "Name:" | tail -1 | awk '{print $2}' | head -1)
    if [ -z "$RESOLVED_IP" ]; then
        RESOLVED_IP=$(dig +short ${DOMAIN_NAME} | head -1)
    fi
    
    if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
        print_success "DNS A record correctly points to ${SERVER_IP}"
        ((CHECKS_PASSED++))
    else
        print_error "DNS A record points to ${RESOLVED_IP}, should be ${SERVER_IP}"
        print_warning "Please update your DNS A record before deployment"
        ((CHECKS_FAILED++))
    fi
else
    print_error "Cannot resolve ${DOMAIN_NAME}"
    print_warning "Please configure DNS A record: ${DOMAIN_NAME} → ${SERVER_IP}"
    ((CHECKS_FAILED++))
fi

print_status "Checking www subdomain..."
if nslookup www.${DOMAIN_NAME} >/dev/null 2>&1; then
    print_success "www.${DOMAIN_NAME} resolves correctly"
    ((CHECKS_PASSED++))
else
    print_warning "www.${DOMAIN_NAME} does not resolve"
    print_warning "Consider adding CNAME: www → ${DOMAIN_NAME}"
    ((CHECKS_WARNING++))
fi

# Check 2: Server Connectivity
print_header "2. Server Connectivity Check"

print_status "Testing SSH connectivity to ${SERVER_IP}..."
if timeout 10 nc -z ${SERVER_IP} 22 >/dev/null 2>&1; then
    print_success "SSH port (22) is accessible on ${SERVER_IP}"
    ((CHECKS_PASSED++))
else
    print_error "Cannot connect to SSH port on ${SERVER_IP}"
    print_warning "Ensure SSH is enabled and firewall allows port 22"
    ((CHECKS_FAILED++))
fi

print_status "Testing HTTP connectivity to ${SERVER_IP}..."
if timeout 10 nc -z ${SERVER_IP} 80 >/dev/null 2>&1; then
    print_warning "HTTP port (80) is already open - this is normal if server is configured"
    ((CHECKS_WARNING++))
else
    print_status "HTTP port (80) is not open - will be configured during deployment"
    ((CHECKS_PASSED++))
fi

print_status "Testing HTTPS connectivity to ${SERVER_IP}..."
if timeout 10 nc -z ${SERVER_IP} 443 >/dev/null 2>&1; then
    print_warning "HTTPS port (443) is already open - this is normal if server is configured"
    ((CHECKS_WARNING++))
else
    print_status "HTTPS port (443) is not open - will be configured during deployment"
    ((CHECKS_PASSED++))
fi

# Check 3: GitHub Repository Access
print_header "3. GitHub Repository Check"

REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
print_status "Checking GitHub repository access: ${REPO_URL}"

if git ls-remote ${REPO_URL} >/dev/null 2>&1; then
    print_success "GitHub repository is accessible"
    ((CHECKS_PASSED++))
else
    print_error "Cannot access GitHub repository: ${REPO_URL}"
    print_warning "Please check repository URL and access permissions"
    ((CHECKS_FAILED++))
fi

# Check 4: Local Dependencies
print_header "4. Local Dependencies Check"

print_status "Checking for required tools..."

if command_exists curl; then
    print_success "curl is available"
    ((CHECKS_PASSED++))
else
    print_error "curl is not installed"
    print_warning "Install curl: apt install curl (Ubuntu) or brew install curl (macOS)"
    ((CHECKS_FAILED++))
fi

if command_exists ssh; then
    print_success "ssh is available"
    ((CHECKS_PASSED++))
else
    print_error "ssh is not installed"
    print_warning "Install OpenSSH client"
    ((CHECKS_FAILED++))
fi

if command_exists git; then
    print_success "git is available"
    ((CHECKS_PASSED++))
else
    print_error "git is not installed"
    print_warning "Install git: apt install git (Ubuntu) or brew install git (macOS)"
    ((CHECKS_FAILED++))
fi

if command_exists nslookup || command_exists dig; then
    print_success "DNS lookup tools are available"
    ((CHECKS_PASSED++))
else
    print_warning "DNS lookup tools not found - some checks may be limited"
    ((CHECKS_WARNING++))
fi

# Check 5: Project Structure
print_header "5. Project Structure Check"

print_status "Checking project files..."

if [ -f "docker/docker-compose.yml" ]; then
    print_success "Docker Compose configuration found"
    ((CHECKS_PASSED++))
else
    print_error "docker/docker-compose.yml not found"
    ((CHECKS_FAILED++))
fi

if [ -f "scripts/deploy-custom.sh" ]; then
    print_success "Custom deployment script found"
    ((CHECKS_PASSED++))
else
    print_error "scripts/deploy-custom.sh not found"
    print_warning "Run this script from the project root directory"
    ((CHECKS_FAILED++))
fi

if [ -f ".env" ] || [ -f ".env.example" ]; then
    print_success "Environment configuration found"
    ((CHECKS_PASSED++))
else
    print_warning "No .env or .env.example file found"
    ((CHECKS_WARNING++))
fi

# Check 6: Deployment Script Validation
print_header "6. Deployment Script Validation"

if [ -f "scripts/deploy-custom.sh" ]; then
    print_status "Validating deployment script..."
    
    if grep -q "${SERVER_IP}" scripts/deploy-custom.sh; then
        print_success "Server IP is correctly configured in deployment script"
        ((CHECKS_PASSED++))
    else
        print_error "Server IP not found in deployment script"
        ((CHECKS_FAILED++))
    fi
    
    if grep -q "${DOMAIN_NAME}" scripts/deploy-custom.sh; then
        print_success "Domain name is correctly configured in deployment script"
        ((CHECKS_PASSED++))
    else
        print_error "Domain name not found in deployment script"
        ((CHECKS_FAILED++))
    fi
    
    if [ -x "scripts/deploy-custom.sh" ]; then
        print_success "Deployment script is executable"
        ((CHECKS_PASSED++))
    else
        print_warning "Deployment script is not executable"
        print_status "Run: chmod +x scripts/deploy-custom.sh"
        ((CHECKS_WARNING++))
    fi
fi

# Summary
print_header "Pre-Deployment Check Summary"

echo "Checks passed: ${CHECKS_PASSED}"
echo "Checks failed: ${CHECKS_FAILED}"
echo "Warnings: ${CHECKS_WARNING}"
echo ""

if [ ${CHECKS_FAILED} -eq 0 ]; then
    print_success "All critical checks passed! ✅"
    echo ""
    print_status "You're ready to deploy! Follow these steps:"
    echo ""
    echo "1. Copy the deployment script to your server:"
    echo "   scp scripts/deploy-custom.sh root@${SERVER_IP}:~/"
    echo ""
    echo "2. SSH to your server:"
    echo "   ssh root@${SERVER_IP}"
    echo ""
    echo "3. Run the deployment script:"
    echo "   chmod +x deploy-custom.sh"
    echo "   sudo ./deploy-custom.sh"
    echo ""
    echo "4. After deployment, visit:"
    echo "   https://${DOMAIN_NAME}"
    echo ""
    
    if [ ${CHECKS_WARNING} -gt 0 ]; then
        print_warning "Note: There are ${CHECKS_WARNING} warnings that should be addressed"
    fi
    
    exit 0
else
    print_error "❌ ${CHECKS_FAILED} critical issues found!"
    echo ""
    print_status "Please fix the issues above before proceeding with deployment."
    echo ""
    print_status "Common fixes:"
    echo "• Update DNS A record: ${DOMAIN_NAME} → ${SERVER_IP}"
    echo "• Ensure SSH access to server"
    echo "• Check GitHub repository permissions"
    echo "• Install missing dependencies"
    echo ""
    exit 1
fi
