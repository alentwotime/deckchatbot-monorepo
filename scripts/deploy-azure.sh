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

print_status "Starting DeckChatbot deployment on Azure..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_status "Updating system packages..."
apt update && apt upgrade -y

print_status "Installing required software..."

# Install Azure CLI
if ! command_exists az; then
    print_status "Installing Azure CLI..."
    curl -sL https://aka.ms/InstallAzureCLIDeb | bash
    print_success "Azure CLI installed successfully"
else
    print_success "Azure CLI already installed"
fi

# Install Docker
if ! command_exists docker; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
    print_success "Docker installed successfully"
else
    print_success "Docker already installed"
fi

# Install Docker Compose
if ! command_exists docker-compose; then
    print_status "Installing Docker Compose..."
    apt install docker-compose-plugin -y
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose already installed"
fi

# Install other required packages
print_status "Installing additional packages..."
apt install -y git nginx certbot python3-certbot-nginx ufw htop curl

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

print_status "Cloning repository from ${REPO_URL}..."
cd /opt
if [ -d "${REPO_NAME}" ]; then
    print_warning "Repository directory already exists. Updating..."
    cd "${REPO_NAME}"
    git pull
else
    git clone "${REPO_URL}"
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
cd docker
docker compose down || true
docker compose build --no-cache
docker compose up -d

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
