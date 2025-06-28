# Getting Started with Hetzner Cloud - Your Next Steps

Congratulations on creating your Hetzner Cloud account! 🎉

Since you're ready to get your DeckChatbot application online, here are the **immediate next steps** you need to take:

## Step 1: Create Your Server (5 minutes)

1. **Go to your Hetzner Console**: https://console.hetzner.com/projects
2. **Click "Add Server"**
3. **Configure your server:**
   - **Location**: Choose closest to your users (Ashburn for US, Falkenstein for Europe)
   - **Image**: Ubuntu 22.04
   - **Type**: CPX11 (2 vCPUs, 4 GB RAM) - **$4.15/month**
   - **SSH Keys**: Add your SSH key (see [SSH Setup Guide](ssh-setup-guide.md) if you need help)
   - **Name**: `deckchatbot-server`
4. **Click "Create & Buy now"**
5. **Wait 1-2 minutes** for the server to be created
6. **Copy the server IP address** - you'll need this!

## Step 2: Deploy Your Application (10 minutes)

You have two options:

### Option A: Automated Deployment (Recommended)
Run this single command on your server:

```bash
# SSH into your server
ssh root@178.156.163.36

# Run the automated deployment script
curl -fsSL https://raw.githubusercontent.com/aklin/deckchatbot-monorepo/main/scripts/deploy-hetzner.sh | bash
```

The script will:
- ✅ Install Docker, Nginx, and all dependencies
- ✅ Clone your repository
- ✅ Configure firewall and security
- ✅ Start all services
- ✅ Set up SSL certificates (if you have a domain)

### Option B: Manual Step-by-Step
Follow the detailed guide: [`hetzner-deployment-guide.md`](hetzner-deployment-guide.md)

## Step 3: Access Your Application

After deployment completes:

1. **Open your browser**
2. **Go to**: `http://178.156.163.36`
3. **You should see your DeckChatbot application running!**

## Optional: Set Up a Custom Domain

If you have a domain name:

1. **Point your domain's A record** to your server IP
2. **During deployment**, choose "yes" when asked about domain setup
3. **The script will automatically get SSL certificates** for HTTPS

## What Happens Next?

Your application will be running with:
- ✅ **Frontend**: React application
- ✅ **Backend**: API server
- ✅ **AI Service**: Ollama with Llama 3.1 model
- ✅ **Reverse Proxy**: Nginx with security headers
- ✅ **Firewall**: UFW configured for security
- ✅ **SSL**: Let's Encrypt certificates (if domain used)

## Troubleshooting

If something goes wrong:

1. **Check service status**:
   ```bash
   cd /opt/deckchatbot-monorepo/docker
   docker compose ps
   ```

2. **View logs**:
   ```bash
   docker compose logs -f
   ```

3. **Restart services**:
   ```bash
   docker compose restart
   ```

## Cost Breakdown

- **Server**: $4.15/month
- **Bandwidth**: Included (20TB)
- **Backups**: $0.83/month (optional)
- **Domain**: $10-15/year (optional)

**Total**: ~$5/month (vs $120-230/month for AWS!)

## Need Help?

- 📖 **Detailed Guide**: [`hetzner-deployment-guide.md`](hetzner-deployment-guide.md)
- 🔧 **Deployment Script**: [`../scripts/deploy-hetzner.sh`](../scripts/deploy-hetzner.sh)
- 💰 **Cost Comparison**: [`cost-effective-deployment-alternatives.md`](cost-effective-deployment-alternatives.md)

## Ready to Start?

1. **Go to**: https://console.hetzner.com/projects
2. **Create your server** (Step 1 above)
3. **Run the deployment script** (Step 2 above)
4. **Access your application** (Step 3 above)

Your DeckChatbot will be online in less than 15 minutes! 🚀
