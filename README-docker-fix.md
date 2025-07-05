# Docker Environment Variable and Build Fix

This document explains the changes made to fix the Docker build issues and environment variable warnings.

## Issues Fixed

1. **Environment Variable Warnings**:
   - Warning: `The "SESSION_SECRET" variable is not set. Defaulting to a blank string.`
   - Warning: `The "JWT_SECRET" variable is not set. Defaulting to a blank string.`
   - Warning: `The "ENCRYPTION_KEY" variable is not set. Defaulting to a blank string.`
   - Warning: `The "DATABASE_URL" variable is not set. Defaulting to a blank string.`
   - Warning: `The "AZURE_AI_KEY" variable is not set. Defaulting to a blank string.`
   - Warning: `The "OPENAI_API_KEY" variable is not set. Defaulting to a blank string.`
   - Warning: `The "OPENAI_ADMIN_API_KEY" variable is not set. Defaulting to a blank string.`
   - Warning: `The "HF_API_TOKEN" variable is not set. Defaulting to a blank string.`

2. **Docker Compose Version Warning**:
   - Warning: `the attribute 'version' is obsolete, it will be ignored, please remove it to avoid potential confusion`

3. **AI Service Build Error**:
   - Error: `failed to solve: process "/bin/sh -c poetry config virtualenvs.create false && poetry install --no-root --only main" did not complete successfully: exit code: 1`

4. **Disk Space Issue During Build**:
   - Error: `ResourceExhausted: failed to copy files: copy file range failed: no space left on device`
   - This error occurred when copying Python packages from the builder stage to the production stage

## Changes Made

1. **Removed Obsolete Version Attribute**:
   - Removed the `version: '3.8'` line from the docker-compose.yml file as it's no longer needed in newer Docker Compose versions.

2. **Added Default Values for Environment Variables**:
   - Created a `.env.docker` file with default values for all required environment variables:
     ```
     SESSION_SECRET=docker-dev-session-secret
     JWT_SECRET=docker-dev-jwt-secret
     ENCRYPTION_KEY=docker-dev-encryption-key-32chars
     DATABASE_URL=sqlite:///./docker.db
     AZURE_AI_KEY=dummy-azure-ai-key-for-docker-dev
     ```
   - Updated docker-compose.yml to include this file for both backend and ai-service:
     ```yaml
     env_file:
       - ../.env
       - ../.env.docker
     ```
   - Kept the existing default values for other environment variables:
     ```yaml
     environment:
       - HF_API_TOKEN=${HF_API_TOKEN:-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}
       - OPENAI_API_KEY=${OPENAI_API_KEY:-dummy-openai-key}
       - OPENAI_ADMIN_API_KEY=${OPENAI_ADMIN_API_KEY:-dummy-admin-key}
     ```
   - This ensures that even if these variables are not defined in the environment or .env file, Docker will use the provided default values.

3. **AI Service Permission Issue Fixed**:
   - Fixed the issue where the AI service container was exiting with error: `chmod: changing permissions of '/tmp/poetry_cache': Operation not permitted`
   - Modified the entrypoint.sh script to handle permission errors gracefully:
     ```bash
     # Try to set permissions, but don't fail if we can't
     chmod 777 /tmp/poetry_cache 2>/dev/null || echo "Warning: Could not set permissions on /tmp/poetry_cache"
     ```
   - Added fallback to use directories in the user's home directory when /tmp is not writable:
     ```bash
     # If we can't write to /tmp directories, use user's home directory instead
     if [ ! -w "/tmp/poetry_cache" ]; then
         echo "Warning: /tmp/poetry_cache is not writable, using ~/.poetry_cache instead"
         mkdir -p ~/.poetry_cache
         export POETRY_CACHE_DIR=~/.poetry_cache
     fi
     ```
   - The Dockerfile already includes a `poetry lock` command to update the lock file if the pyproject.toml has changed.
   - The entrypoint.sh file correctly starts the AI service using uvicorn directly without Poetry.

4. **Optimized AI Service Dockerfile for Disk Space**:
   - Added cleanup steps in the builder stage:
     ```dockerfile
     # Clean pip cache to reduce disk space usage
     pip cache purge && \
     # Remove unnecessary files to reduce image size
     find /usr/local/lib/python3.11/site-packages -name "*.pyc" -delete && \
     find /usr/local/lib/python3.11/site-packages -name "__pycache__" -exec rm -rf {} +
     ```
   - Changed the approach for copying Python packages:
     ```dockerfile
     # Copy only the necessary packages instead of the entire site-packages directory
     COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/
     COPY --from=builder /usr/local/bin/python /usr/local/bin/
     COPY --from=builder /usr/local/bin/pip /usr/local/bin/
     COPY --from=builder /usr/local/lib/python3.11/site-packages/fastapi /usr/local/lib/python3.11/site-packages/fastapi
     # ... other necessary packages
     ```
   - This significantly reduces the amount of disk space required during the build process.

## Testing the Changes

### Windows (PowerShell)

1. Open PowerShell as Administrator
2. Navigate to the project directory
3. Run the rebuild script:
   ```powershell
   .\scripts\rebuild-docker.ps1
   ```

### Linux/macOS (Bash)

1. Open a terminal
2. Navigate to the project directory
3. Make the script executable and run it:
   ```bash
   chmod +x scripts/rebuild-docker.sh
   ./scripts/rebuild-docker.sh
   ```

## Expected Results

After running the rebuild script, you should see:

1. No warnings about missing environment variables
2. No warnings about the obsolete version attribute
3. All containers should build and start successfully
4. The ai-service container should be healthy and running

If you still encounter issues, please check the logs for more detailed error messages.

## Testing the Disk Space Optimization

To specifically test the disk space optimization changes for the AI service, you can use the provided test script:

### Linux/macOS (Bash)

```bash
sudo bash scripts/test-docker-build-optimized.sh
```

This script will:
- Clean Docker resources before building
- Build only the AI service using docker-compose
- Check disk space before and after building
- Print the size of the AI service Docker image

### Additional Disk Space Management

For ongoing disk space management:

1. Run `docker system prune -af --volumes` regularly to clean up Docker resources
2. Monitor disk space usage with `df -h`
3. Consider using a larger VM size for production deployments if disk space issues persist
4. See the `docs/disk-space-management.md` file for comprehensive guidance on disk space management
