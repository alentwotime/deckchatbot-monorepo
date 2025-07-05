# Docker Environment Variable and Build Fix

This document explains the changes made to fix the Docker build issues and environment variable warnings.

## Issues Fixed

1. **Environment Variable Warnings**:
   - Warning: `The "OPENAI_API_KEY" variable is not set. Defaulting to a blank string.`
   - Warning: `The "OPENAI_ADMIN_API_KEY" variable is not set. Defaulting to a blank string.`
   - Warning: `The "HF_API_TOKEN" variable is not set. Defaulting to a blank string.`

2. **Docker Compose Version Warning**:
   - Warning: `the attribute 'version' is obsolete, it will be ignored, please remove it to avoid potential confusion`

3. **AI Service Build Error**:
   - Error: `failed to solve: process "/bin/sh -c poetry config virtualenvs.create false && poetry install --no-root --only main" did not complete successfully: exit code: 1`

## Changes Made

1. **Removed Obsolete Version Attribute**:
   - Removed the `version: '3.8'` line from the docker-compose.yml file as it's no longer needed in newer Docker Compose versions.

2. **Added Default Values for Environment Variables**:
   - Modified the docker-compose.yml file to provide default values for environment variables:
     ```yaml
     environment:
       - HF_API_TOKEN=${HF_API_TOKEN:-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}
       - OPENAI_API_KEY=${OPENAI_API_KEY:-dummy-openai-key}
       - OPENAI_ADMIN_API_KEY=${OPENAI_ADMIN_API_KEY:-dummy-admin-key}
     ```
   - This ensures that even if these variables are not defined in the environment or .env file, Docker will use the provided default values.

3. **AI Service Dockerfile Already Fixed**:
   - The Dockerfile already includes a `poetry lock` command to update the lock file if the pyproject.toml has changed.
   - The entrypoint.sh file correctly starts the AI service using uvicorn directly without Poetry.

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
