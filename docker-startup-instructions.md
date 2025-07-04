# Docker Desktop Startup Instructions

## The Issue
Your Docker build is failing because Docker Desktop is not currently running. The error shows:
```
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.50/info": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

## How to Start Docker Desktop

### Step 1: Launch Docker Desktop
1. **Find Docker Desktop**: Look for the Docker icon in your:
   - Start Menu (search for "Docker Desktop")
   - Desktop shortcut
   - System tray (if already running but not connected)

2. **Start the Application**: 
   - Click on Docker Desktop to launch it
   - You may see a whale icon in your system tray

### Step 2: Wait for Docker to Start
Docker Desktop takes a few moments to start up. You'll know it's ready when:

1. **System Tray Icon**: The Docker whale icon appears in your system tray (bottom-right corner)
2. **Icon Status**: The whale icon should be steady (not animated/spinning)
3. **Tooltip**: Hovering over the icon should show "Docker Desktop is running"

### Step 3: Verify Docker is Ready
Once you think Docker is ready, run this command to test:
```powershell
docker info
```

You should see detailed information about Docker (not just client info). If you still see connection errors, wait a bit longer.

## Next Steps
Once Docker Desktop is running and `docker info` works without errors:

1. **Run the fix script**:
   ```powershell
   .\fix-docker-build-issue.ps1
   ```

2. **Or manually fix the build**:
   ```powershell
   cd docker
   docker compose build --no-cache
   docker compose up -d
   ```

## Troubleshooting
- **Docker Desktop won't start**: Try restarting your computer
- **Still getting connection errors**: Wait 2-3 minutes after Docker Desktop appears to start
- **Permission issues**: Make sure you're running PowerShell as Administrator if needed

## Why This Happened
The Docker build failure occurred because Docker's build cache contained old layers from before we fixed the frontend Dockerfile. Even though the configuration is now correct, Docker was using cached layers where webpack wasn't available during the build step.

The fix script will:
1. Clear all Docker build cache
2. Remove old containers and images  
3. Rebuild everything from scratch
4. Start all services fresh

This ensures webpack and all dependencies are properly available during the build process.
