# Docker Build Issue Fix

## Problem Description

You may encounter the following error when building the Docker containers:

```
> [frontend builder 8/8] RUN npm run build && rm -rf node_modules && npm ci --only=production && npm cache clean --force:
1.579 > deckchatbot-frontend@1.0.0 build
1.579 > webpack --mode production
1.579
1.592 sh: webpack: not found
```

## Root Cause

This error occurs due to **Docker build cache** containing outdated layers from before the Dockerfile was fixed. Even though the current Dockerfile is correct, Docker may use cached layers that were built with the old configuration where webpack wasn't available during the build step.

## Current Configuration (Correct)

The frontend Dockerfile has been fixed and now correctly:

1. **Installs all dependencies** (including dev dependencies like webpack):
   ```dockerfile
   RUN npm ci && \
       npm cache clean --force
   ```

2. **Builds the application** with webpack available:
   ```dockerfile
   RUN npm run build && \
       # Remove development dependencies and clean up
       rm -rf node_modules && \
       npm ci --only=production && \
       npm cache clean --force
   ```

3. **Package.json includes webpack** as a dev dependency:
   ```json
   "devDependencies": {
     "webpack": "^5.99.9",
     "webpack-cli": "^6.0.1",
     // ... other dev dependencies
   }
   ```

## Solution

The issue is resolved by clearing Docker's build cache and rebuilding the containers from scratch. We've provided automated scripts to do this:

### For Windows Users (PowerShell)

```powershell
# Run from the project root directory
.\fix-docker-build-issue.ps1
```

### For Linux/Mac Users (Bash)

```bash
# Run from the project root directory
chmod +x fix-docker-build-issue.sh
./fix-docker-build-issue.sh
```

## Manual Fix (Alternative)

If you prefer to fix this manually, follow these steps:

### Step 1: Stop and Clean Up

```bash
# Navigate to docker directory
cd docker

# Stop running containers
docker compose down

# Remove containers
docker compose rm -f

# Remove old images
docker images | grep deckchatbot | awk '{print $3}' | xargs docker rmi -f

# Clear build cache
docker builder prune -f
```

### Step 2: Rebuild Without Cache

```bash
# Build without cache (this is crucial!)
docker compose build --no-cache

# Start services
docker compose up -d
```

### Step 3: Verify

```bash
# Check if services are running
docker compose ps

# Check logs if needed
docker compose logs -f
```

## What the Fix Scripts Do

Both scripts perform the following actions automatically:

1. **Verify Docker is running**
2. **Stop all running containers**
3. **Remove old containers and images**
4. **Clear Docker build cache** (this is the key step)
5. **Verify configuration is correct**
6. **Rebuild containers without cache**
7. **Start all services**
8. **Verify services are accessible**

## Expected Results

After running the fix:

- ✅ Frontend accessible at: http://localhost:3000
- ✅ Backend API accessible at: http://localhost:8000  
- ✅ AI Service accessible at: http://localhost:8001

## Common Notes

- **OPENAI_API_KEY warning**: This warning is expected when using Ollama (AI_PROVIDER=ollama) and can be safely ignored.
- **Build time**: The rebuild process may take 5-15 minutes depending on your system.
- **Internet connection**: Required to download fresh base images and dependencies.

## Troubleshooting

### If the scripts fail:

1. **Ensure Docker is running**:
   ```bash
   docker info
   ```

2. **Check available disk space**:
   ```bash
   docker system df
   ```

3. **Manual cleanup if needed**:
   ```bash
   docker system prune -a --volumes
   ```

### If services don't start:

1. **Check logs**:
   ```bash
   cd docker
   docker compose logs
   ```

2. **Check individual service logs**:
   ```bash
   docker compose logs frontend
   docker compose logs backend
   docker compose logs ai-service
   ```

3. **Restart specific service**:
   ```bash
   docker compose restart frontend
   ```

## Prevention

To avoid this issue in the future:

1. **Always use `--no-cache`** when rebuilding after Dockerfile changes:
   ```bash
   docker compose build --no-cache
   ```

2. **Clear build cache** periodically:
   ```bash
   docker builder prune -f
   ```

3. **Monitor Docker disk usage**:
   ```bash
   docker system df
   ```

## Technical Details

### Why Docker Cache Causes This Issue

Docker builds images in layers and caches each layer for efficiency. When we fixed the Dockerfile to install all dependencies before building, Docker may still use the cached layer from the old version where only production dependencies were installed.

### The Fix Explained

The `--no-cache` flag forces Docker to rebuild every layer from scratch, ensuring that:

1. All dependencies (including webpack) are freshly installed
2. The build process has access to all required tools
3. No stale cached layers interfere with the build

This is why the manual fix of just changing the Dockerfile wasn't sufficient - the cache needed to be cleared.
