# DeckChatbot Deployment Guide

## Server & Domain Information
- **Server ID**: #66421252
- **Server Name**: AlensDeckBot
- **Server IP (IPv4)**: 178.156.163.36
- **IPv6**: 2a01:4ff:f0:f8d5::/64
- **Private IP**: 10.0.0.2
- **Floating IP**: 5.161.23.197
- **Domain**: AlensDeckBot.online
- **Target URL**: https://AlensDeckBot.online

## Prerequisites

### 1. Domain DNS Configuration
Before running the deployment script, ensure your domain DNS is properly configured:

1. **A Record**: Point `AlensDeckBot.online` to `178.156.163.36`
2. **CNAME Record**: Point `www.AlensDeckBot.online` to `AlensDeckBot.online`

**DNS Configuration Example:**
```
Type    Name    Value               TTL
A       @       178.156.163.36      300
CNAME   www     AlensDeckBot.online 300
```

### 2. Server Access
Ensure you have SSH access to your server:
```bash
ssh root@178.156.163.36
```

### 3. GitHub Repository Access
Make sure your GitHub repository is accessible. Update the `GITHUB_USER` variable in the deployment script if needed.

## Deployment Steps

### Step 1: Connect to Your Server
```bash
ssh root@178.156.163.36
```

### Step 2: Download the Deployment Script
```bash
# Download the custom deployment script
curl -o deploy-custom.sh https://raw.githubusercontent.com/aklin/deckchatbot-monorepo/main/scripts/deploy-custom.sh

# Make it executable
chmod +x deploy-custom.sh
```

### Step 3: Run the Deployment Script
```bash
# Run the deployment script as root
sudo ./deploy-custom.sh
```

The script will automatically:
- ✅ Update the system packages
- ✅ Install Docker and Docker Compose
- ✅ Install Nginx and Certbot
- ✅ Configure firewall (UFW)
- ✅ Clone the repository
- ✅ Set up environment variables
- ✅ Start all services (Frontend, Backend, AI Service)
- ✅ Configure Nginx reverse proxy
- ✅ Set up SSL certificate with Let's Encrypt
- ✅ Install security enhancements (fail2ban, auto-updates)
- ✅ Perform health checks

### Step 4: Verify Deployment
After the script completes, verify your deployment:

1. **Check Services Status:**
   ```bash
   cd /opt/deckchatbot-monorepo/docker
   docker compose ps
   ```

2. **Check Logs:**
   ```bash
   docker compose logs -f
   ```

3. **Test Website:**
   - Visit: https://AlensDeckBot.online
   - Check SSL certificate is valid
   - Test all features (chatbot, file upload, 3D visualization)

## Service Architecture

Your deployed application consists of three main services:

### Frontend (Port 3000 → HTTPS/80,443)
- **URL**: https://AlensDeckBot.online/
- **Technology**: React/Next.js application
- **Features**: User interface, 3D visualization, file upload

### Backend API (Port 8000 → /api/)
- **URL**: https://AlensDeckBot.online/api/
- **Technology**: Python FastAPI
- **Features**: Main application logic, file processing

### AI Service (Port 8001 → /ai/)
- **URL**: https://AlensDeckBot.online/ai/
- **Technology**: Python with Ollama
- **Features**: AI chatbot, deck analysis

## Post-Deployment Configuration

### 1. Environment Variables
Edit the environment file if needed:
```bash
nano /opt/deckchatbot-monorepo/.env
```

### 2. SSL Certificate Management
- **Check SSL status**: `certbot certificates`
- **Manual renewal**: `certbot renew`
- **Auto-renewal**: Already configured (runs daily at 12:00)

### 3. Monitoring and Maintenance

#### Check Service Status
```bash
cd /opt/deckchatbot-monorepo/docker
docker compose ps
```

#### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f ai-service
```

#### Restart Services
```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart frontend
```

#### Update Application
```bash
cd /opt/deckchatbot-monorepo
git pull
docker compose down
docker compose up -d --build
```

#### Monitor Resources
```bash
# System resources
htop

# Docker resources
docker stats
```

## Troubleshooting

### Common Issues

#### 1. Services Not Starting
```bash
# Check logs
docker compose logs

# Check system resources
df -h
free -h
```

#### 2. SSL Certificate Issues
```bash
# Check certificate status
certbot certificates

# Test certificate renewal
certbot renew --dry-run

# Manual certificate renewal
certbot --nginx -d AlensDeckBot.online -d www.AlensDeckBot.online
```

#### 3. Domain Not Resolving
```bash
# Check DNS resolution
nslookup AlensDeckBot.online
dig AlensDeckBot.online

# Check if domain points to correct IP
ping AlensDeckBot.online
```

#### 4. Nginx Configuration Issues
```bash
# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Check Nginx status
systemctl status nginx
```

### Log Locations
- **Application Logs**: `docker compose logs`
- **Nginx Logs**: `/var/log/nginx/`
- **SSL Logs**: `/var/log/letsencrypt/`
- **System Logs**: `/var/log/syslog`

## Security Considerations

### Firewall Configuration
The deployment automatically configures UFW with these rules:
- **SSH (22)**: Allowed
- **HTTP (80)**: Allowed (redirects to HTTPS)
- **HTTPS (443)**: Allowed
- **All other ports**: Denied

### Security Features Enabled
- ✅ **fail2ban**: Protection against brute force attacks
- ✅ **Automatic security updates**: System stays updated
- ✅ **SSL/TLS encryption**: All traffic encrypted
- ✅ **Security headers**: XSS protection, content type sniffing protection
- ✅ **Firewall**: Only necessary ports open

### Additional Security Recommendations
1. **Change default SSH port** (optional)
2. **Set up SSH key authentication** (disable password auth)
3. **Regular backups** of application data
4. **Monitor logs** for suspicious activity
5. **Keep dependencies updated**

## Backup and Recovery

### Backup Important Files
```bash
# Create backup directory
mkdir -p /backup/$(date +%Y%m%d)

# Backup application
cp -r /opt/deckchatbot-monorepo /backup/$(date +%Y%m%d)/

# Backup Nginx configuration
cp -r /etc/nginx /backup/$(date +%Y%m%d)/

# Backup SSL certificates
cp -r /etc/letsencrypt /backup/$(date +%Y%m%d)/
```

### Recovery Process
1. Restore application files
2. Restore Nginx configuration
3. Restore SSL certificates
4. Restart services

## Support and Maintenance

### Regular Maintenance Tasks
- **Weekly**: Check logs for errors
- **Monthly**: Update system packages
- **Quarterly**: Review security settings
- **As needed**: Update application code

### Getting Help
If you encounter issues:
1. Check the logs first
2. Verify DNS configuration
3. Test individual services
4. Check system resources
5. Review this guide

## Success Indicators

Your deployment is successful when:
- ✅ https://AlensDeckBot.online loads without errors
- ✅ SSL certificate is valid and trusted
- ✅ All three services are running (frontend, backend, ai-service)
- ✅ Chatbot responds to messages
- ✅ File upload functionality works
- ✅ 3D visualization displays correctly

## Next Steps

After successful deployment:
1. **Test all features** thoroughly
2. **Set up monitoring** (optional)
3. **Configure backups** (recommended)
4. **Add custom content** or branding
5. **Monitor performance** and optimize as needed

---

**Congratulations!** Your DeckChatbot is now live at https://AlensDeckBot.online 🎉
