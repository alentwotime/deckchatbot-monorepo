# Docker Troubleshooting Guide

This guide will help you resolve common Docker issues in the DeckChatBot project.

## Quick Fix for Docker Desktop Service Issues

If you're seeing the error message:

```
[WARNING] Docker Desktop Service is not running. Run fix-docker-admin.ps1 as Administrator to fix this.
[ERROR] Docker is not running. Please start Docker Desktop and try again.
```

Follow these steps to fix the issue:

### Option 1: Use the Automated Fix Script (Recommended)

1. Open PowerShell in the repository root directory
2. Run the fix script:
   ```powershell
   .\fix-docker-admin.ps1
   ```
3. The script will automatically request administrator privileges if needed
4. Follow any on-screen instructions
5. Once Docker is running, return to the docker directory and run the network fix:
   ```powershell
   cd docker
   .\fix-docker-network.ps1
   ```

### Option 2: Manual Fix

If the automated script doesn't work, you can manually fix the issue:

1. Right-click on the Docker Desktop icon in the system tray
2. Select "Restart Docker Desktop"
3. Wait for Docker to fully start (green icon)
4. Open PowerShell as Administrator
5. Run:
   ```powershell
   docker context use default
   $env:DOCKER_API_VERSION='1.41'
   docker ps
   ```

## Common Docker Issues and Solutions

### Network Creation Hanging

If Docker Compose gets stuck on "Network docker_decknet Creating" for an extended period:

1. Navigate to the docker directory:
   ```powershell
   cd docker
   ```

2. Run the network diagnostic script:
   ```powershell
   .\fix-docker-network.ps1
   ```

3. Try the simplified configuration:
   ```powershell
   docker compose -f docker-compose-simple.yml up --build
   ```

4. Test your subnet configuration:
   ```powershell
   .\test-subnet-config.ps1
   ```
   This script tests if the subnet 192.168.65.0/24 is correctly configured and if there are any conflicts.

5. Check the subnet configuration guide:
   ```powershell
   notepad SUBNET_CONFIGURATION.md
   ```
   This guide explains the trade-offs between using a custom subnet (192.168.65.0/24) and default Docker networking.

### Port Conflicts

If you see errors about ports already being in use:

1. Check which processes are using the ports:
   ```powershell
   netstat -ano | findstr :3000
   netstat -ano | findstr :8000
   netstat -ano | findstr :8001
   ```

2. Stop the conflicting processes or change the port mappings in your docker-compose.yml file

### Docker API Version Issues

If you see errors about Docker API version incompatibility:

1. Set the API version environment variable:
   ```powershell
   $env:DOCKER_API_VERSION='1.41'
   ```

2. Try different versions if needed (1.40, 1.39, etc.)

## Additional Resources

For more detailed troubleshooting:

- Check the `docker/TROUBLESHOOTING.md` file
- Check the `docker/DOCKER_API_FIX_GUIDE.md` file
- Run the diagnostic script: `scripts/diagnose-issues.ps1`

If you continue to experience issues, please refer to the Docker Desktop documentation or contact the project maintainers.
