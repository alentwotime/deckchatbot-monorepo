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
1. Set the Docker API version to 1.41 (a compatible version)
2. Enable Docker CLI experimental features
3. Run docker-compose with the fixed configuration

## Manual Fix

If you prefer to fix the issue manually:

1. Set the Docker API version environment variable:
   ```powershell
   $env:DOCKER_API_VERSION="1.41"
   ```

2. Run docker-compose:
   ```powershell
   docker-compose up --build -d
   ```

## Permanent Fix

To make the fix permanent, add the DOCKER_API_VERSION environment variable to your system:

1. Open **System Properties** → **Environment Variables**
2. Add new **System Variable**:
   - Name: `DOCKER_API_VERSION`
   - Value: `1.41`

## Changes Made

The following changes were made to fix the issue:

1. Added version specification to docker-compose.yml (version: '3.8')
2. Removed custom subnet configuration that was causing issues
3. Created a batch file to set the DOCKER_API_VERSION environment variable

## Additional Resources

For more detailed information about Docker API issues, see:
- [DOCKER_API_FIX_GUIDE.md](./DOCKER_API_FIX_GUIDE.md)
- [DOCKER_API_500_COMPLETE_FIX.md](./DOCKER_API_500_COMPLETE_FIX.md)

You can also run the automated fix scripts:
- `fix-docker-api-issues.ps1` - API compatibility fix (no admin required)
- `fix-docker-admin.ps1` - Complete Docker fix (requires Administrator)
