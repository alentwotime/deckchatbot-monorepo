# Docker Daemon Configuration Guide

## Overview

This guide explains how to configure your Docker daemon settings to optimize performance and resolve compatibility issues for the DeckChatBot project.

## Current Configuration

Your current Docker daemon configuration is:

```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false
}
```

This minimal configuration is missing several important optimizations that can help improve Docker's performance and stability.

## Recommended Configuration

We recommend enhancing your daemon.json file with the following optimized configuration:

```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "features": {
    "buildkit": true
  },
  "default-address-pools": [
    {
      "base": "192.168.65.0/24",
      "size": 24
    }
  ],
  "default-shm-size": "2G",
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  },
  "storage-driver": "windowsfilter",
  "storage-opts": [
    "size=50GB"
  ],
  "no-new-privileges": true,
  "registry-mirrors": [
    "https://registry-1.docker.io"
  ],
  "max-concurrent-downloads": 5,
  "max-concurrent-uploads": 5
}
```

## How to Apply These Changes

1. **Locate your daemon.json file**:
   - Windows: `C:\ProgramData\docker\config\daemon.json`
   - Linux: `/etc/docker/daemon.json`
   - macOS: `~/.docker/daemon.json`

2. **Edit the file**:
   - Open the file with an editor (run as Administrator on Windows)
   - Replace the contents with the recommended configuration above
   - Save the file

3. **Restart Docker**:
   - Windows (PowerShell as Administrator):
     ```powershell
     Restart-Service com.docker.service
     # If the above command fails, try:
     Get-Service *docker* | Restart-Service
     ```
   - Linux:
     ```bash
     sudo systemctl restart docker
     ```
   - macOS: Restart Docker Desktop from the system tray

4. **Verify the changes**:
   ```
   docker info
   ```

## Automated Setup

Alternatively, you can use our automated setup script:

```powershell
# Run from the project root
.\scripts\daemon-config.ps1
```

## Understanding the Configuration Settings

### Builder Cache Settings
```json
"builder": {
  "gc": {
    "defaultKeepStorage": "20GB",
    "enabled": true
  }
}
```
- Controls how Docker manages its build cache
- Limits build cache to 20GB to prevent disk space issues
- Enables automatic garbage collection to clean up unused layers

### BuildKit Enablement
```json
"experimental": false,
"features": {
  "buildkit": true
}
```
- Enables BuildKit, Docker's next-generation build system
- Faster builds with parallel dependency resolution
- Better caching for multi-stage builds

### Networking Configuration
```json
"default-address-pools": [
  {
    "base": "192.168.65.0/24",
    "size": 24
  }
]
```
- Defines the default IP address pools for networks
- Matches the subnet used in our docker-compose.yml
- Prevents IP address conflicts with other networks

### Resource Limits
```json
"default-shm-size": "2G",
"default-ulimits": {
  "nofile": {
    "Name": "nofile",
    "Hard": 64000,
    "Soft": 64000
  }
}
```
- Sets default resource limits for containers
- Increased shared memory size (2GB) for AI service requirements
- Higher file descriptor limits for handling many concurrent connections

### Logging Configuration
```json
"log-driver": "json-file",
"log-opts": {
  "max-size": "50m",
  "max-file": "3"
}
```
- Controls how container logs are managed
- Prevents log files from consuming excessive disk space
- Rotates logs (3 files of 50MB each)

### Storage Settings
```json
"storage-driver": "windowsfilter",
"storage-opts": [
  "size=50GB"
]
```
- Configures Docker's storage driver and options
- Limits container filesystem size to prevent disk space issues
- Improves I/O performance with optimized settings

### Security Enhancements
```json
"no-new-privileges": true
```
- Enhances container security
- Prevents privilege escalation within containers

### Performance Optimizations
```json
"registry-mirrors": [
  "https://registry-1.docker.io"
],
"max-concurrent-downloads": 5,
"max-concurrent-uploads": 5
```
- Improves Docker's performance for image operations
- Faster image pulls with registry mirrors
- Optimized concurrent operations for better network utilization

## Important Note About API Version

The Docker API version is **not** configured in the daemon.json file. Instead, it's set using environment variables:

```powershell
$env:DOCKER_API_VERSION="1.41"
```

To make this setting permanent, add it to your system environment variables:
1. Open **System Properties** → **Environment Variables**
2. Add new **System Variable**:
   - Name: `DOCKER_API_VERSION`
   - Value: `1.41`

## Relationship to Previous Fixes

Our previous fixes focused on setting environment variables to address API version compatibility issues:
- Setting `DOCKER_API_VERSION` to a compatible version (1.41)
- Setting `DOCKER_HOST` to an empty string to use the default pipe path
- Setting `DOCKER_CLI_EXPERIMENTAL` to "enabled"

These environment variables work alongside the daemon.json configuration to provide a complete solution:
- Environment variables control client-side behavior
- daemon.json controls server-side behavior

By implementing both sets of changes, you'll have a fully optimized Docker environment that avoids API version compatibility issues.

## Troubleshooting

If you encounter issues after applying the configuration:

1. Check Docker logs:
   ```powershell
   # Windows
   Get-EventLog -LogName Application -Source docker -Newest 50
   ```

2. Verify the configuration was applied:
   ```
   docker info
   ```

3. If needed, revert to the default configuration by removing the daemon.json file and restarting Docker.

## References

- [Docker Daemon Configuration Documentation](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-configuration-file)
- [Docker Storage Drivers](https://docs.docker.com/storage/storagedriver/select-storage-driver/)
- [Docker Logging Configuration](https://docs.docker.com/config/containers/logging/configure/)
