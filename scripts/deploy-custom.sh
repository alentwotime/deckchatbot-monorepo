#!/bin/bash

# Custom Deployment Script for DeckChatbot
# Server: 178.156.163.36
# Domain: AlensDeckBot.online

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Pre-configured values
SERVER_IP="178.156.163.36"
DOMAIN_NAME="AlensDeckBot.online"
GITHUB_USER="aklin"  # Update this with your actual GitHub username
REPO_NAME="deckchatbot-monorepo"

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

print_status "Starting DeckChatbot deployment for ${DOMAIN_NAME} on ${SERVER_IP}..."

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
        print_status "Creating production .env file..."
        cat > .env << EOF
# AI Configuration
AI_PROVIDER=ollama
OLLAMA_MODEL_NAME=llava-deckbot

# Production settings
NODE_ENV=production
ENVIRONMENT=production
DOMAIN=${DOMAIN_NAME}

# Optional: Add your API keys here if needed
# OPENAI_API_KEY=your_openai_key_here
# HF_API_TOKEN=your_hf_token_here
EOF
        print_success "Created production .env file"
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
print_status "Configuring Nginx reverse proxy for ${DOMAIN_NAME}..."

# Create directory for Let's Encrypt ACME challenges
print_status "Setting up Let's Encrypt challenge directory..."
mkdir -p /var/www/html/.well-known/acme-challenge
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# Create Nginx configuration
cat > /etc/nginx/sites-available/deckchatbot << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files \$uri =404;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;

        # Increase timeout for AI operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # AI Service
    location /ai/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;

        # Increase timeout for AI operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
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

# Set up SSL certificate
print_status "Setting up SSL certificate for ${DOMAIN_NAME}..."
print_warning "Make sure ${DOMAIN_NAME} DNS A record points to ${SERVER_IP}"

# Test domain accessibility before SSL setup
print_status "Testing domain accessibility..."
sleep 5

# Create a test file for domain verification
echo "Domain verification test" > /var/www/html/test.txt

# Test if domain is accessible
if curl -s -f "http://${DOMAIN_NAME}/test.txt" >/dev/null 2>&1; then
    print_success "Domain ${DOMAIN_NAME} is accessible"
else
    print_error "Domain ${DOMAIN_NAME} is not accessible. Please check DNS settings."
    print_error "Make sure the A record for ${DOMAIN_NAME} points to ${SERVER_IP}"
    exit 1
fi

# Test www subdomain
WWW_DOMAIN="yes"
if curl -s -f "http://www.${DOMAIN_NAME}/test.txt" >/dev/null 2>&1; then
    print_success "Domain www.${DOMAIN_NAME} is accessible"
else
    print_warning "Domain www.${DOMAIN_NAME} is not accessible. Continuing with main domain only."
    WWW_DOMAIN=""
fi

# Clean up test file
rm -f /var/www/html/test.txt

print_status "Proceeding with SSL setup..."
sleep 5

# Obtain SSL certificate using webroot method
if [ -n "$WWW_DOMAIN" ]; then
    print_status "Obtaining SSL certificate for both ${DOMAIN_NAME} and www.${DOMAIN_NAME}..."
    certbot certonly --webroot -w /var/www/html -d "${DOMAIN_NAME}" -d "www.${DOMAIN_NAME}" --non-interactive --agree-tos --email "admin@${DOMAIN_NAME}"
else
    print_status "Obtaining SSL certificate for ${DOMAIN_NAME} only..."
    certbot certonly --webroot -w /var/www/html -d "${DOMAIN_NAME}" --non-interactive --agree-tos --email "admin@${DOMAIN_NAME}"
fi

# Update nginx configuration with SSL
if [ -f "/etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem" ]; then
    print_success "SSL certificate obtained successfully"

    # Update nginx configuration to include SSL
    cat > /etc/nginx/sites-available/deckchatbot << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files \$uri =404;
    }

    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;

        # Increase timeout for AI operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # AI Service
    location /ai/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;

        # Increase timeout for AI operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Reload nginx with new SSL configuration
    nginx -t && systemctl reload nginx
    print_success "Nginx updated with SSL configuration"
else
    print_error "SSL certificate generation failed"
    exit 1
fi

# Set up auto-renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
print_success "SSL certificate installed and auto-renewal configured"

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
print_status "Your application is now available at:"
echo "  🌐 https://${DOMAIN_NAME}"
echo "  🌐 https://www.${DOMAIN_NAME}"
echo ""
print_status "Useful commands:"
echo "  📊 Check service status: cd /opt/${REPO_NAME}/docker && docker compose ps"
echo "  📋 View logs: cd /opt/${REPO_NAME}/docker && docker compose logs -f"
echo "  🔄 Restart services: cd /opt/${REPO_NAME}/docker && docker compose restart"
echo "  📈 Monitor resources: htop"
echo "  🔒 Check SSL status: certbot certificates"
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
echo "  • SSL certificate will auto-renew every 12 hours"
echo ""
print_success "Deployment completed successfully! 🎉"
print_status "Visit https://${DOMAIN_NAME} to see your DeckChatbot in action!"
