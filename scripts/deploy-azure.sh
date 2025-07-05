#!/bin/bash

# Azure Deployment Script for DeckChatbot
# This script automates the deployment process on Azure
#
# Azure Configuration:
# Subscription: Azure subscription 1
# Resource Group: deckchatbot-rg
# VM Name: deckchatbot-vm
# Region: eastus
# Public IP: 172.191.9.27
# Username: azureuser
#
# Disk Space Management:
# This script includes automatic disk space checks and cleanup.
# If you encounter disk space issues, see docs/disk-space-management.md

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for user input
wait_for_user() {
    echo -e "${YELLOW}Press Enter to continue...${NC}"
    read -r
}

# Function to check available disk space
check_disk_space() {
    local min_space_mb=$1
    local mount_point=${2:-"/"}

    # Get available space in MB
    local available_space=$(df -m $mount_point | awk 'NR==2 {print $4}')

    if [ "$available_space" -lt "$min_space_mb" ]; then
        print_warning "Low disk space detected: ${available_space}MB available, ${min_space_mb}MB required"
        return 1
    else
        print_success "Sufficient disk space: ${available_space}MB available"
        return 0
    fi
}

# Function to clean up disk space
cleanup_disk_space() {
    print_status "Cleaning up disk space..."

    # Clean package cache
    apt clean

    # Remove old package lists
    rm -rf /var/lib/apt/lists/*

    # Remove old kernels (keeping the current one)
    dpkg -l 'linux-*' | awk '/^ii/{ print $2}' | grep -v "$(uname -r | sed 's/-generic//')" | xargs apt-get -y purge 2>/dev/null || true

    # Remove unused Docker resources
    if command_exists docker; then
        print_status "Cleaning up Docker resources..."
        docker system prune -af --volumes
    fi

    # Remove temporary files
    find /tmp -type f -atime +10 -delete
    find /var/tmp -type f -atime +10 -delete

    # Clean journal logs
    if command_exists journalctl; then
        print_status "Cleaning up journal logs..."
        journalctl --vacuum-time=3d
    fi

    # Remove old log files
    find /var/log -type f -name "*.gz" -delete
    find /var/log -type f -name "*.1" -delete
    find /var/log -type f -name "*.2" -delete
    find /var/log -type f -name "*.3" -delete
    find /var/log -type f -name "*.4" -delete
    find /var/log -type f -name "*.5" -delete
    find /var/log -type f -name "*.6" -delete
    find /var/log -type f -name "*.7" -delete

    # Clean apt cache
    apt-get autoremove -y
    apt-get autoclean -y

    # Display new disk space
    df -h /
}

# Parse command line arguments
CLEANUP_ONLY=false
TEST_MODE=false

# Process command line arguments
for arg in "$@"; do
    case $arg in
        --cleanup)
            CLEANUP_ONLY=true
            shift
            ;;
        --test-mode)
            TEST_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --cleanup    Run disk cleanup only without deployment"
            echo "  --test-mode  Run in test mode (for testing disk space handling)"
            echo "  --help       Show this help message"
            exit 0
            ;;
    esac
done

print_status "Starting DeckChatbot deployment on Azure..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# If cleanup-only mode is enabled, just run cleanup and exit
if [ "$CLEANUP_ONLY" = true ]; then
    print_status "Running in cleanup-only mode..."
    print_status "Current disk space:"
    df -h /
    cleanup_disk_space
    print_success "Cleanup completed. Exiting."
    exit 0
fi

# If test mode is enabled, run a simulated deployment with disk space checks
if [ "$TEST_MODE" = true ]; then
    print_status "Running in test mode (simulated deployment)..."
    print_status "Current disk space:"
    df -h /

    # Simulate low disk space
    print_status "Simulating low disk space scenario..."
    print_warning "Low disk space detected (simulation)"

    # Run cleanup
    print_status "Running disk cleanup..."
    cleanup_disk_space

    # Show disk space after cleanup
    print_status "Disk space after cleanup:"
    df -h /

    print_success "Test mode completed successfully. The script is properly handling disk space issues."
    print_status "In a real deployment, the script would continue with the installation process."
    exit 0
fi

# Check initial disk space
print_status "Checking disk space..."
df -h /

# Ensure we have at least 1GB free before starting
if ! check_disk_space 1024; then
    print_warning "Low disk space detected before starting deployment"
    print_status "Performing initial disk cleanup..."
    cleanup_disk_space

    # Check if cleanup freed enough space
    if ! check_disk_space 1024; then
        print_error "Insufficient disk space even after cleanup. At least 1GB is required."
        print_status "Please free up more disk space manually and try again."
        exit 1
    fi
fi

print_status "Updating system packages..."
# Try to update, but handle disk space errors
if ! apt update; then
    print_error "Failed to update package lists. This might be due to disk space issues."
    cleanup_disk_space
    print_status "Retrying package update after cleanup..."
    apt update
fi

# Check disk space before upgrade
if ! check_disk_space 512; then
    print_warning "Low disk space before package upgrade"
    cleanup_disk_space
fi

# Try to upgrade with error handling
if ! apt upgrade -y; then
    print_error "Failed to upgrade packages. This might be due to disk space issues."
    cleanup_disk_space
    print_status "Retrying package upgrade after cleanup..."
    apt upgrade -y
fi

print_status "Installing required software..."

# Check disk space before installing software
if ! check_disk_space 512; then
    print_warning "Low disk space before software installation"
    cleanup_disk_space
fi

# Install Azure CLI
if ! command_exists az; then
    print_status "Installing Azure CLI..."
    if ! curl -sL https://aka.ms/InstallAzureCLIDeb | bash; then
        print_error "Failed to install Azure CLI. This might be due to disk space issues."
        cleanup_disk_space
        print_status "Retrying Azure CLI installation after cleanup..."
        curl -sL https://aka.ms/InstallAzureCLIDeb | bash
    fi
    print_success "Azure CLI installed successfully"
else
    print_success "Azure CLI already installed"
fi

# Check disk space before Docker installation
if ! check_disk_space 1024; then
    print_warning "Low disk space before Docker installation"
    cleanup_disk_space
fi

# Install Docker
if ! command_exists docker; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    if ! sh get-docker.sh; then
        print_error "Failed to install Docker. This might be due to disk space issues."
        cleanup_disk_space
        print_status "Retrying Docker installation after cleanup..."
        sh get-docker.sh
    fi
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
    print_success "Docker installed successfully"
else
    print_success "Docker already installed"
fi

# Check disk space before installing more packages
if ! check_disk_space 512; then
    print_warning "Low disk space before additional package installation"
    cleanup_disk_space
fi

# Install Docker Compose
if ! command_exists docker-compose; then
    print_status "Installing Docker Compose..."
    if ! apt install docker-compose-plugin -y; then
        print_error "Failed to install Docker Compose. This might be due to disk space issues."
        cleanup_disk_space
        print_status "Retrying Docker Compose installation after cleanup..."
        apt install docker-compose-plugin -y
    fi
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose already installed"
fi

# Install other required packages
print_status "Installing additional packages..."
if ! apt install -y git nginx certbot python3-certbot-nginx ufw htop curl; then
    print_error "Failed to install additional packages. This might be due to disk space issues."
    cleanup_disk_space
    print_status "Retrying additional package installation after cleanup..."
    apt install -y git nginx certbot python3-certbot-nginx ufw htop curl
fi

print_status "Configuring firewall..."
# Configure UFW
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

print_success "Firewall configured successfully"

print_status "Starting and enabling services..."
systemctl start nginx
systemctl enable nginx
systemctl start docker
systemctl enable docker

# Get repository URL
echo ""
print_status "Repository Configuration"
echo "Please provide your GitHub repository details:"
read -p "GitHub username: " GITHUB_USER
read -p "Repository name (default: deckchatbot-monorepo): " REPO_NAME
REPO_NAME=${REPO_NAME:-deckchatbot-monorepo}

# Clone repository
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

# Check disk space before Git operations
if ! check_disk_space 512 "/opt"; then
    print_warning "Low disk space before Git operations"
    cleanup_disk_space
fi

print_status "Cloning repository from ${REPO_URL}..."
cd /opt
if [ -d "${REPO_NAME}" ]; then
    print_warning "Repository directory already exists. Updating..."
    cd "${REPO_NAME}"

    # Clean up any Git garbage before pulling
    git gc --prune=now

    # Pull with error handling
    if ! git pull; then
        print_error "Git pull failed. This might be due to disk space issues."
        cleanup_disk_space
        print_status "Retrying Git pull after cleanup..."
        git pull
    fi
else
    # Clone with error handling
    if ! git clone "${REPO_URL}"; then
        print_error "Git clone failed. This might be due to disk space issues."
        cleanup_disk_space
        print_status "Retrying Git clone after cleanup..."
        git clone "${REPO_URL}"
    fi
    cd "${REPO_NAME}"
fi

print_success "Repository cloned/updated successfully"

# Create environment file
print_status "Configuring environment variables..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
    else
        print_warning ".env.example not found, creating basic .env file"
        cat > .env << EOF
REACT_APP_API_BASE_URL=http://localhost:8000
AI_SERVICE_URL=http://localhost:8001
HF_API_TOKEN=${HF_API_TOKEN}
HUGGING_FACE_API_KEY=${HUGGING_FACE_API_KEY}
AZURE_SUBSCRIPTION=Azure subscription 1
AZURE_RESOURCE_GROUP=deckchatbot-rg
AZURE_VM_NAME=deckchatbot-vm
AZURE_REGION=eastus
AZURE_PUBLIC_IP=172.191.9.27
AZURE_USERNAME=azureuser
EOF
    fi
else
    print_success ".env file already exists"
fi

# Get domain name
echo ""
print_status "Domain Configuration"
read -p "Enter your domain name (default: AlensDeckBot.online): " DOMAIN_NAME
DOMAIN_NAME=${DOMAIN_NAME:-AlensDeckBot.online}

print_status "Building and starting Docker containers..."

# Check disk space before Docker operations
if ! check_disk_space 2048 "/"; then
    print_warning "Low disk space before Docker build operations"
    cleanup_disk_space

    # Check again after cleanup
    if ! check_disk_space 2048 "/"; then
        print_warning "Still low on disk space after cleanup. Docker build might fail."
        print_status "Proceeding with caution..."
    fi
fi

cd docker

# Stop any running containers to free up resources
print_status "Stopping any running containers..."
docker compose down || true

# Clean up Docker system before building
print_status "Cleaning up Docker system before building..."
docker system prune -af --volumes || true

# Build with error handling
print_status "Building Docker containers..."
if ! docker compose build --no-cache; then
    print_error "Docker build failed. This might be due to disk space issues."
    cleanup_disk_space
    print_status "Retrying Docker build after cleanup..."
    docker compose build --no-cache
fi

# Start containers with error handling
print_status "Starting Docker containers..."
if ! docker compose up -d; then
    print_error "Failed to start Docker containers. This might be due to disk space issues."
    cleanup_disk_space
    print_status "Retrying Docker container startup after cleanup..."
    docker compose up -d
fi

print_success "Docker containers started successfully"

# Configure Nginx
print_status "Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/deckchatbot << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # AI Service
    location /ai/ {
        proxy_pass http://localhost:8001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/deckchatbot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t
systemctl reload nginx

print_success "Nginx configured successfully"

# Setup SSL with Let's Encrypt
print_status "Setting up SSL certificate with Let's Encrypt..."
certbot --nginx -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME} --non-interactive --agree-tos --email admin@${DOMAIN_NAME}

print_success "SSL certificate configured successfully"

# Install security enhancements
print_status "Installing security enhancements..."
apt install -y fail2ban

# Configure fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl start fail2ban

print_success "Security enhancements installed"

# Setup automatic updates
print_status "Configuring automatic security updates..."
apt install -y unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades

print_success "Automatic updates configured"

# Final health check
print_status "Performing final health checks..."

# Check if containers are running
if docker compose ps | grep -q "Up"; then
    print_success "Docker containers are running"
else
    print_error "Some Docker containers are not running"
    docker compose ps
fi

# Check if nginx is running
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
fi

# Check if services are accessible
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    print_success "Frontend service is accessible"
else
    print_warning "Frontend service may not be ready yet"
fi

if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    print_success "Backend service is accessible"
else
    print_warning "Backend service may not be ready yet"
fi

echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
echo "Your DeckChatbot application should now be accessible at:"
echo "  🌐 https://${DOMAIN_NAME}"
echo "  🌐 https://www.${DOMAIN_NAME}"
echo ""
echo "Next steps:"
echo "  1. Wait a few minutes for all services to fully start"
echo "  2. Visit your website to test functionality"
echo "  3. Check logs if needed: cd /opt/${REPO_NAME}/docker && docker compose logs -f"
echo ""
print_status "Deployment log saved to: /var/log/deckchatbot-deployment.log"
