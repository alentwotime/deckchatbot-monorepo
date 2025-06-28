#!/bin/bash

# Hetzner Cloud Deployment Script for DeckChatbot
# This script automates the deployment process on a fresh Ubuntu server

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

print_status "Starting DeckChatbot deployment on Hetzner Cloud..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_status "Updating system packages..."
apt update && apt upgrade -y

print_status "Installing required software..."

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
        print_status "Creating basic .env file..."
        cat > .env << EOF
# AI Configuration
AI_PROVIDER=ollama
OLLAMA_MODEL_NAME=llama3.1:8b

# Production settings
NODE_ENV=production
ENVIRONMENT=production

# Optional: Add your API keys here
# OPENAI_API_KEY=your_openai_key_here
# HUGGING_FACE_API_KEY=your_hf_key_here
EOF
        print_success "Created basic .env file"
    fi
else
    print_success ".env file already exists"
fi

print_status "Starting DeckChatbot services..."
cd docker
docker compose down 2>/dev/null || true
docker compose up -d

print_status "Waiting for services to start..."
sleep 30

# Check if services are running
print_status "Checking service status..."
if docker compose ps | grep -q "Up"; then
    print_success "Services are running"
else
    print_error "Some services failed to start. Check logs with: docker compose logs"
    exit 1
fi

# Configure Nginx
print_status "Configuring Nginx reverse proxy..."

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
print_status "Server IP detected: ${SERVER_IP}"

# Ask for domain name
echo ""
print_status "Domain Configuration"
echo "Do you have a domain name you want to use? (y/n)"
read -r USE_DOMAIN

if [[ $USE_DOMAIN =~ ^[Yy]$ ]]; then
    read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
    SERVER_NAME=$DOMAIN_NAME
    print_status "Using domain: ${DOMAIN_NAME}"
    print_warning "Make sure to point your domain's A record to: ${SERVER_IP}"
    wait_for_user
else
    SERVER_NAME=$SERVER_IP
    print_status "Using IP address: ${SERVER_IP}"
fi

# Create Nginx configuration
cat > /etc/nginx/sites-available/deckchatbot << EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
    }

    # AI Service
    location /ai/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/deckchatbot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if nginx -t; then
    systemctl reload nginx
    print_success "Nginx configured successfully"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Set up SSL if domain is used
if [[ $USE_DOMAIN =~ ^[Yy]$ ]]; then
    print_status "Setting up SSL certificate..."
    echo "Do you want to set up SSL certificate with Let's Encrypt? (y/n)"
    read -r SETUP_SSL
    
    if [[ $SETUP_SSL =~ ^[Yy]$ ]]; then
        print_status "Obtaining SSL certificate for ${DOMAIN_NAME}..."
        certbot --nginx -d "${DOMAIN_NAME}" --non-interactive --agree-tos --email admin@"${DOMAIN_NAME}"
        
        # Set up auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        print_success "SSL certificate installed and auto-renewal configured"
    fi
fi

# Final checks
print_status "Performing final checks..."

# Test services
sleep 10
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    print_success "Frontend is responding"
else
    print_warning "Frontend may not be fully ready yet"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health | grep -q "200"; then
    print_success "Backend is responding"
else
    print_warning "Backend may not be fully ready yet"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health | grep -q "200"; then
    print_success "AI Service is responding"
else
    print_warning "AI Service may not be fully ready yet"
fi

# Security recommendations
print_status "Setting up security enhancements..."

# Install fail2ban
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban

# Set up automatic security updates
apt install unattended-upgrades -y
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades

print_success "Security enhancements installed"

# Display final information
echo ""
echo "=============================================="
print_success "DeckChatbot deployment completed!"
echo "=============================================="
echo ""
print_status "Access your application at:"
if [[ $USE_DOMAIN =~ ^[Yy]$ ]]; then
    if [[ $SETUP_SSL =~ ^[Yy]$ ]]; then
        echo "  🌐 https://${DOMAIN_NAME}"
    else
        echo "  🌐 http://${DOMAIN_NAME}"
    fi
else
    echo "  🌐 http://${SERVER_IP}"
fi
echo ""
print_status "Useful commands:"
echo "  📊 Check service status: cd /opt/${REPO_NAME}/docker && docker compose ps"
echo "  📋 View logs: cd /opt/${REPO_NAME}/docker && docker compose logs -f"
echo "  🔄 Restart services: cd /opt/${REPO_NAME}/docker && docker compose restart"
echo "  📈 Monitor resources: htop"
echo ""
print_status "Configuration files:"
echo "  🔧 Application: /opt/${REPO_NAME}/.env"
echo "  🌐 Nginx: /etc/nginx/sites-available/deckchatbot"
echo ""
print_warning "Important notes:"
echo "  • Services may take a few minutes to fully initialize"
echo "  • Check logs if you encounter any issues"
echo "  • Update your .env file with API keys if needed"
echo "  • Consider setting up monitoring and backups"
echo ""
print_success "Deployment completed successfully! 🎉"
