# Hetzner Cloud Deployment Guide for DeckChatbot

This guide will walk you through deploying the DeckChatbot application on Hetzner Cloud, providing a cost-effective alternative to AWS at just **$4.15/month**.

## Prerequisites

- ✅ Hetzner Cloud account (already created)
- Git installed on your local machine
- SSH client and SSH keys set up (see [SSH Setup Guide](ssh-setup-guide.md) for help)

## Step 1: Create a Hetzner Cloud Server

1. **Log into Hetzner Cloud Console**
   - Go to https://console.hetzner.com/projects
   - Select your project or create a new one

2. **Create a New Server**
   - Click "Add Server"
   - **Location**: Choose the closest to your users (e.g., Ashburn for US East, Falkenstein for Europe)
   - **Image**: Ubuntu 22.04
   - **Type**: CPX11 (2 vCPUs, 4 GB RAM, 40 GB SSD) - **$4.15/month**
   - **Networking**: 
     - ✅ Public IPv4
     - ✅ Public IPv6 (optional)
   - **SSH Keys**: Add your SSH key or create one
   - **Firewalls**: We'll configure this later
   - **Backups**: Optional (adds $0.83/month)
   - **Name**: `deckchatbot-server`

3. **Create the Server**
   - Click "Create & Buy now"
   - Wait for the server to be created (usually 1-2 minutes)
   - Note the server's IP address

## Step 2: Initial Server Setup

1. **Connect to Your Server**
   ```bash
   ssh root@178.156.163.36
   ```

2. **Update the System**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install Required Software**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   apt install docker-compose-plugin -y

   # Install Git
   apt install git -y

   # Install Nginx (for reverse proxy)
   apt install nginx -y

   # Install Certbot (for SSL certificates)
   apt install certbot python3-certbot-nginx -y
   ```

4. **Start and Enable Services**
   ```bash
   systemctl start docker
   systemctl enable docker
   systemctl start nginx
   systemctl enable nginx
   ```

## Step 3: Configure Firewall

1. **Set up UFW (Uncomplicated Firewall)**
   ```bash
   # Install UFW
   apt install ufw -y

   # Set default policies
   ufw default deny incoming
   ufw default allow outgoing

   # Allow SSH
   ufw allow ssh

   # Allow HTTP and HTTPS
   ufw allow 80
   ufw allow 443

   # Enable firewall
   ufw --force enable

   # Check status
   ufw status
   ```

## Step 4: Deploy the DeckChatbot Application

1. **Clone the Repository**
   ```bash
   cd /opt
   git clone https://github.com/aklin/deckchatbot-monorepo.git
   cd deckchatbot-monorepo
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env
   nano .env
   ```

   Configure your environment variables:
   ```env
   # AI Configuration
   AI_PROVIDER=ollama
   OLLAMA_MODEL_NAME=llama3.1:8b

   # Optional: OpenAI API Key (if using OpenAI instead of Ollama)
   # OPENAI_API_KEY=your_openai_key_here

   # Optional: Hugging Face API Key (for enhanced features)
   # HUGGING_FACE_API_KEY=your_hf_key_here

   # Production settings
   NODE_ENV=production
   ENVIRONMENT=production
   ```

3. **Start the Application**
   ```bash
   cd docker
   docker compose up -d
   ```

4. **Verify Services are Running**
   ```bash
   docker compose ps
   ```

   You should see all three services (frontend, backend, ai-service) running.

## Step 5: Configure Nginx Reverse Proxy

1. **Create Nginx Configuration**
   ```bash
   nano /etc/nginx/sites-available/deckchatbot
   ```

2. **Add the Following Configuration**
   ```nginx
   server {
       listen 80;
       server_name AlensDeckBot.online;

       # Frontend
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Backend API
       location /api/ {
           proxy_pass http://localhost:8000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # AI Service
       location /ai/ {
           proxy_pass http://localhost:8001/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable the Site**
   ```bash
   ln -s /etc/nginx/sites-available/deckchatbot /etc/nginx/sites-enabled/
   rm /etc/nginx/sites-enabled/default
   nginx -t
   systemctl reload nginx
   ```

## Step 6: Set Up SSL Certificate (Optional but Recommended)

If you have a domain name:

1. **Point Your Domain to the Server**
   - Update your domain's DNS A record to point to your server's IP address

2. **Get SSL Certificate**
   ```bash
   certbot --nginx -d AlensDeckBot.online
   ```

3. **Set Up Auto-Renewal**
   ```bash
   crontab -e
   ```
   Add this line:
   ```
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Step 7: Test Your Deployment

1. **Check if Services are Accessible**
   ```bash
   # Test frontend
   curl -I http://localhost:3000

   # Test backend
   curl -I http://localhost:8000/health

   # Test AI service
   curl -I http://localhost:8001/health
   ```

2. **Access Your Application**
   - Open your browser and go to `http://178.156.163.36` or `https://AlensDeckBot.online`
   - You should see the DeckChatbot application running

## Step 8: Monitoring and Maintenance

1. **View Application Logs**
   ```bash
   cd /opt/deckchatbot-monorepo/docker
   docker compose logs -f
   ```

2. **Update the Application**
   ```bash
   cd /opt/deckchatbot-monorepo
   git pull
   cd docker
   docker compose down
   docker compose up -d --build
   ```

3. **Monitor System Resources**
   ```bash
   # Check disk usage
   df -h

   # Check memory usage
   free -h

   # Check running containers
   docker ps
   ```

## Troubleshooting

### Common Issues

1. **Services Not Starting**
   ```bash
   # Check Docker logs
   docker compose logs

   # Restart services
   docker compose restart
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000

   # Kill the process if needed
   sudo kill -9 PID
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   certbot certificates

   # Renew certificate manually
   certbot renew
   ```

4. **Nginx Configuration Issues**
   ```bash
   # Test nginx configuration
   nginx -t

   # Check nginx status
   systemctl status nginx
   ```

## Cost Breakdown

- **Server**: $4.15/month (CPX11)
- **Backups**: $0.83/month (optional)
- **Domain**: $10-15/year (optional)
- **Total**: ~$5/month

## Security Best Practices

1. **Regular Updates**
   ```bash
   # Set up automatic security updates
   apt install unattended-upgrades -y
   dpkg-reconfigure -plow unattended-upgrades
   ```

2. **SSH Key Authentication Only**
   ```bash
   nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   systemctl restart ssh
   ```

3. **Fail2Ban for SSH Protection**
   ```bash
   apt install fail2ban -y
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

## Next Steps

1. **Custom Domain**: Point your domain to the server IP
2. **SSL Certificate**: Set up HTTPS with Let's Encrypt
3. **Monitoring**: Set up monitoring with tools like Uptime Robot
4. **Backups**: Configure automated backups
5. **CDN**: Consider using Cloudflare for better performance

## Support

If you encounter any issues:
1. Check the application logs: `docker compose logs`
2. Verify all services are running: `docker compose ps`
3. Check system resources: `htop` or `free -h`
4. Review nginx logs: `tail -f /var/log/nginx/error.log`

Your DeckChatbot application should now be running successfully on Hetzner Cloud!
