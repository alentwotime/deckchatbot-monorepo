# SSH Setup Guide - Everything You Need to Know

This guide will help you understand SSH (Secure Shell) and set it up properly for deploying your DeckChatbot application.

## What is SSH?

**SSH (Secure Shell)** is a secure way to connect to remote servers over the internet. Think of it as a secure "remote control" for your server that allows you to:

- Connect to your Hetzner Cloud server
- Run commands on remote servers
- Transfer files securely
- Manage your deployed applications

## Do You Already Have SSH?

### Quick Check

**On Windows 10/11:**

1. Open Command Prompt or PowerShell
2. Type: `ssh -V`
3. If you see a version number, SSH is installed!

**On macOS/Linux:**

1. Open Terminal
2. Type: `ssh -V`
3. If you see a version number, SSH is installed!

### Check for Existing SSH Keys

SSH keys are like digital "passwords" that are more secure than regular passwords.

**Check if you already have SSH keys:**

1. **Windows**: Open PowerShell and run:

   ```powershell
   ls ~/.ssh
   ```

2. **macOS/Linux**: Open Terminal and run:

   ```bash
   ls ~/.ssh
   ```

**What to look for:**

- `id_rsa` and `id_rsa.pub` (RSA key pair)
- `id_ed25519` and `id_ed25519.pub` (Ed25519 key pair - newer and recommended)

If you see these files, **you already have SSH keys!** Skip to the "Using Your SSH Keys" section.

## Installing SSH (If You Don't Have It)

### Windows

**Windows 10/11** comes with SSH built-in, but if it's not working:

1. **Enable OpenSSH Client:**
   - Go to Settings → Apps → Optional Features
   - Click "Add a feature"
   - Find "OpenSSH Client" and install it

2. **Alternative: Install Git for Windows**
   - Download from: <https://git-scm.com/download/win>
   - This includes SSH and Git Bash

### macOS

SSH is pre-installed on macOS. If it's not working, try:

```bash
xcode-select --install
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install openssh-client
```

## Creating New SSH Keys

If you don't have SSH keys, let's create them:

### Step 1: Generate SSH Key Pair

**Recommended method (Ed25519 - more secure):**

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

**Alternative method (RSA - more compatible):**

```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

### Step 2: Follow the Prompts

1. **File location**: Press Enter to use the default location
2. **Passphrase**:
   - **Recommended**: Enter a passphrase for extra security
   - **Optional**: Press Enter twice for no passphrase (less secure but easier)

### Step 3: Verify Your Keys

```bash
ls ~/.ssh
```

You should see:

- `id_ed25519` (private key - keep this secret!)
- `id_ed25519.pub` (public key - this is what you share)

## Using Your SSH Keys

### View Your Public Key

You'll need to copy your public key to add it to services like Hetzner Cloud.

**Windows (PowerShell):**

```powershell
Get-Content ~/.ssh/id_ed25519.pub
```

**macOS/Linux:**

```bash
cat ~/.ssh/id_ed25519.pub
```

**Copy the entire output** - it should look like:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGq... your-email@example.com
```

### Add SSH Key to Hetzner Cloud

1. **Go to Hetzner Cloud Console**: <https://console.hetzner.com/projects>
2. **Navigate to**: Security → SSH Keys
3. **Click**: "Add SSH Key"
4. **Paste your public key** (the output from above)
5. **Give it a name**: e.g., "My Laptop Key"
6. **Click**: "Add SSH Key"

### Add SSH Key to Other Services

**GitHub:**

1. Go to Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste your public key

**Other cloud providers** have similar processes in their security/SSH sections.

## Connecting to Your Server

Once your SSH key is added to Hetzner Cloud:

```bash
ssh root@YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with your actual server IP address.

**First connection:**

- You'll see a message about authenticity - type `yes`
- If you set a passphrase, enter it when prompted

## Troubleshooting Common Issues

### "Permission denied (publickey)"

**Possible solutions:**

1. **Check if your key is loaded:**

   ```bash
   ssh-add -l
   ```

2. **Add your key to SSH agent:**

   ```bash
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Specify the key explicitly:**

   ```bash
   ssh -i ~/.ssh/id_ed25519 root@YOUR_SERVER_IP
   ```

### "Connection refused"

- Check if the server IP is correct
- Make sure the server is running
- Check if port 22 is open (SSH default port)

### "Host key verification failed"

This happens if the server's fingerprint changed:

```bash
ssh-keygen -R YOUR_SERVER_IP
```

Then try connecting again.

### Windows-Specific Issues

**If using Git Bash on Windows:**

```bash
# Start SSH agent
eval $(ssh-agent -s)

# Add your key
ssh-add ~/.ssh/id_ed25519
```

## SSH Configuration File (Advanced)

Create `~/.ssh/config` to simplify connections:

```
Host my-server
    HostName YOUR_SERVER_IP
    User root
    IdentityFile ~/.ssh/id_ed25519
```

Then connect with just:

```bash
ssh my-server
```

## Security Best Practices

1. **Use passphrases** on your SSH keys
2. **Never share your private key** (the file without .pub)
3. **Use different keys** for different purposes
4. **Regularly rotate keys** (create new ones periodically)
5. **Disable password authentication** on servers (SSH keys only)

## Quick Reference

### Essential Commands

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# View public key
cat ~/.ssh/id_ed25519.pub

# Connect to server
ssh root@YOUR_SERVER_IP

# Copy files to server
scp file.txt root@YOUR_SERVER_IP:/path/to/destination/

# Copy files from server
scp root@YOUR_SERVER_IP:/path/to/file.txt ./local-file.txt
```

scp file.txt root@178.156.163.36:/path/to/destination/

### File Locations

- **SSH keys**: `~/.ssh/`
- **Config file**: `~/.ssh/config`
- **Known hosts**: `~/.ssh/known_hosts`

## Next Steps

Now that you have SSH set up:

1. **For Hetzner Cloud deployment**: Follow the [Hetzner Getting Started Guide](hetzner-getting-started.md)
2. **For detailed deployment**: See the [Hetzner Deployment Guide](hetzner-deployment-guide.md)
3. **For other options**: Check [Cost-Effective Deployment Alternatives](cost-effective-deployment-alternatives.md)

## Need Help?

If you're still having trouble:

1. **Check the error message carefully** - it usually tells you what's wrong
2. **Try the troubleshooting steps** above
3. **Search for the specific error message** online
4. **Consider using password authentication temporarily** while you figure out SSH keys

Remember: SSH might seem complicated at first, but once it's set up, it makes server management much easier and more secure!
