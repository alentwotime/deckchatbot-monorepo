# Docker API Fix Guide

## Issue: Docker API 500 Internal Server Error

If you're experiencing Docker API errors like:
```
request returned 500 Internal Server Error for API route and version http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.50/version, check if the server supports the requested API version
```

This guide will help you resolve these issues.

## Root Cause

The main causes of Docker API 500 errors are:

1. **Docker Desktop Service Not Running**: The underlying Docker service is stopped
2. **API Version Incompatibility**: Docker client using newer API version than server supports
3. **Docker Context Issues**: Wrong Docker context pointing to non-functional engine
4. **Docker Desktop Initialization Problems**: Docker Desktop not fully started

## Quick Fix (Recommended)

### Option 1: Run the Admin Fix Script

1. **Right-click PowerShell** and select **"Run as Administrator"**
2. Navigate to the docker directory:
   ```powershell
   cd path\to\your\project\docker
   ```
3. Run the admin fix script:
   ```powershell
   .\fix-docker-admin.ps1
   ```

This script will:
- ✅ Start the Docker Desktop Service
- ✅ Restart Docker Desktop completely
- ✅ Test different API versions to find one that works
- ✅ Create environment setup scripts for future use

### Option 2: Manual Fix (If you can't run as Administrator)

1. **Restart Docker Desktop manually**:
   - Right-click Docker Desktop icon in system tray
   - Select "Restart Docker Desktop"
   - Wait for Docker to fully start (green icon)

2. **Set compatible API version**:
   ```powershell
   $env:DOCKER_API_VERSION="1.41"
   docker context use default
   ```

3. **Test Docker**:
   ```powershell
   docker ps
   ```

## Detailed Troubleshooting

### Step 1: Check Docker Service Status

```powershell
Get-Service | Where-Object {$_.Name -like "*docker*"}
```

If `com.docker.service` shows as "Stopped", you need to start it (requires Administrator):
```powershell
Start-Service com.docker.service
```

### Step 2: Test Different API Versions

Try these API versions in order until one works:

```powershell
# Test API version 1.41
$env:DOCKER_API_VERSION="1.41"; docker version

# Test API version 1.40
$env:DOCKER_API_VERSION="1.40"; docker version

# Test API version 1.39
$env:DOCKER_API_VERSION="1.39"; docker version

# Test API version 1.38
$env:DOCKER_API_VERSION="1.38"; docker version
```

### Step 3: Fix Docker Context

```powershell
# List available contexts
docker context ls

# Switch to default context
docker context use default

# Verify context switch
docker context ls
```

### Step 4: Test Docker Functionality

Once you find a working API version:

```powershell
# Set the working API version
$env:DOCKER_API_VERSION="1.41"  # Replace with your working version

# Test basic commands
docker version
docker ps
docker images
```

## Permanent Fix

### For Current Session
```powershell
$env:DOCKER_API_VERSION="1.41"  # Use your working version
docker context use default
```

### For All Future Sessions

#### Option A: Use the Generated Batch File
After running `fix-docker-admin.ps1`, use the generated `set-docker-env.bat`:
```cmd
.\set-docker-env.bat
```

#### Option B: Set System Environment Variables
1. Open **System Properties** → **Environment Variables**
2. Add new **System Variable**:
   - Name: `DOCKER_API_VERSION`
   - Value: `1.41` (or your working version)

#### Option C: Add to PowerShell Profile
```powershell
# Edit your PowerShell profile
notepad $PROFILE

# Add this line to the profile:
$env:DOCKER_API_VERSION="1.41"
```

## Verification

After applying the fix, verify Docker is working:

```powershell
# Check Docker version
docker version

# List containers
docker ps

# Test Docker Compose
docker compose version

# Test building (in your project directory)
cd path\to\your\project\docker
docker compose -f docker-compose-simple.yml up --no-start
```

## Available Docker Configurations

Once Docker is working, you can use these configurations:

### 1. Simplified Configuration (Recommended for testing)
```powershell
docker compose -f docker-compose-simple.yml up --build
```

### 2. Improved Configuration (Recommended for development)
```powershell
docker compose -f docker-compose-improved.yml up --build
```

### 3. Full Configuration (Production-like)
```powershell
docker compose up --build
```

## Common Issues and Solutions

### Issue: "Docker Desktop Service not found"
**Solution**: Reinstall Docker Desktop

### Issue: Docker commands still fail after service start
**Solution**: 
1. Restart your computer
2. Start Docker Desktop as Administrator
3. Run the fix script again

### Issue: API version keeps reverting
**Solution**: Set the environment variable permanently (see Permanent Fix section)

### Issue: Docker Compose fails with network errors
**Solution**: Use the simplified configuration first:
```powershell
docker compose -f docker-compose-simple.yml up --build
```

## Prevention

To prevent future Docker API issues:

1. **Always use compatible API versions**:
   ```powershell
   $env:DOCKER_API_VERSION="1.41"
   ```

2. **Use default Docker context**:
   ```powershell
   docker context use default
   ```

3. **Regular Docker maintenance**:
   ```powershell
   docker system prune -f
   ```

4. **Keep Docker Desktop updated** but test after updates

## Getting Help

If you're still experiencing issues:

1. **Run the diagnostic script**:
   ```powershell
   .\fix-docker-network.ps1
   ```

2. **Check Docker Desktop logs**:
   - Docker Desktop → Settings → Troubleshoot → Show logs

3. **Reset Docker Desktop** (last resort):
   - Docker Desktop → Settings → Troubleshoot → Reset to factory defaults

## Success Indicators

You'll know Docker is working when:
- ✅ `docker version` shows both client and server information
- ✅ `docker ps` lists containers without errors
- ✅ `docker compose version` works
- ✅ No 500 Internal Server Error messages

## Scripts Reference

- `fix-docker-admin.ps1` - Complete Docker fix (requires Administrator)
- `fix-docker-api-issues.ps1` - API compatibility fix (no admin required)
- `fix-docker-network.ps1` - Network diagnostics and cleanup
- `set-docker-env.bat` - Environment setup (generated by admin script)

Run these scripts from the `docker` directory of your project.
