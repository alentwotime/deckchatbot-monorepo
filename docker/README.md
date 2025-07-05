# Docker Configuration

## Docker API Version Issue Fix

If you encounter the following error when running Docker commands:

```
ERROR: request returned Internal Server Error for API route and version http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.47/info, check if the server supports the requested API version
```

This is due to a compatibility issue between the Docker client and the Docker engine. The solution is to set a compatible API version.

## Quick Fix

Run the provided batch file to set the correct Docker API version and start the containers:

```powershell
.\docker-api-fix.bat
```

This script will:
1. Test multiple Docker API versions (1.41, 1.40, 1.39, 1.38) to find one that works
2. Enable Docker CLI experimental features
3. Clear any existing Docker host settings
4. Set the Docker context to default
5. Run docker-compose with the simplified configuration (docker-compose-simple.yml)

## Manual Fix

If you prefer to fix the issue manually:

1. Try different Docker API versions until one works:
   ```powershell
   # Try API version 1.41
   $env:DOCKER_API_VERSION="1.41"
   docker version

   # If that doesn't work, try API version 1.40
   $env:DOCKER_API_VERSION="1.40"
   docker version

   # If that doesn't work, try API version 1.39
   $env:DOCKER_API_VERSION="1.39"
   docker version

   # If that doesn't work, try API version 1.38
   $env:DOCKER_API_VERSION="1.38"
   docker version
   ```

2. Clear any existing Docker host settings:
   ```powershell
   $env:DOCKER_HOST=""
   ```

3. Set the Docker context to default:
   ```powershell
   docker context use default
   ```

4. Run docker-compose with the simplified configuration:
   ```powershell
   docker-compose -f docker-compose-simple.yml up --build -d
   ```

## Permanent Fix

To make the fix permanent, add the following environment variables to your system:

1. Open **System Properties** → **Environment Variables**
2. Add new **System Variables**:
   - Name: `DOCKER_API_VERSION`
   - Value: `1.41` (or whichever version worked for you)

   - Name: `DOCKER_HOST`
   - Value: `` (leave this empty to use default pipe path)

   - Name: `DOCKER_CLI_EXPERIMENTAL`
   - Value: `enabled`

## Changes Made

The following changes were made to fix the issue:

1. Added version specification to docker-compose.yml (version: '3.8')
2. Removed custom subnet configuration that was causing issues
3. Created a batch file to set the DOCKER_API_VERSION environment variable
4. Enhanced the batch file to:
   - Test multiple API versions (1.41, 1.40, 1.39, 1.38) to find one that works
   - Clear any existing Docker host settings to handle pipe path changes
   - Set the Docker context to default
5. Modified the batch file to use the simplified docker-compose configuration (docker-compose-simple.yml) to avoid image reference issues
6. Updated documentation to provide comprehensive troubleshooting steps

## Additional Resources

For more detailed information about Docker API issues, see:
- [DOCKER_API_FIX_GUIDE.md](./DOCKER_API_FIX_GUIDE.md)
- [DOCKER_API_500_COMPLETE_FIX.md](./DOCKER_API_500_COMPLETE_FIX.md)

You can also run the automated fix scripts:
- `fix-docker-api-issues.ps1` - API compatibility fix (no admin required)
- `fix-docker-admin.ps1` - Complete Docker fix (requires Administrator)
