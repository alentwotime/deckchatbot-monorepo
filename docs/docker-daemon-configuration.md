# Docker Daemon Configuration Guide for DeckChatBot

This document explains the improved Docker daemon configuration implemented for the DeckChatBot project, including the benefits of each setting and how to apply the configuration.

## Overview

The Docker daemon (`dockerd`) is the persistent process that manages containers. The daemon configuration file (`daemon.json`) allows you to customize various aspects of Docker's behavior, including performance, security, networking, and resource management.

Our improved configuration optimizes Docker for the DeckChatBot project's specific needs, ensuring better performance, security, and resource utilization.

## Configuration File Location

- **Windows**: `C:\ProgramData\docker\config\daemon.json`
- **Linux**: `/etc/docker/daemon.json`
- **macOS**: `~/.docker/daemon.json`

## Automated Setup

We've created a PowerShell script that automatically generates and applies the optimized Docker daemon configuration:

```powershell
.\scripts\daemon-config.ps1
```

After running the script, restart the Docker service to apply the changes:

```powershell
# Windows (PowerShell as Administrator)
Restart-Service docker

# Linux/macOS
sudo systemctl restart docker
```

## Configuration Details

Our improved Docker daemon configuration includes the following optimizations:

### Builder Cache Settings

```json
"builder": {
  "gc": {
    "defaultKeepStorage": "20GB",
    "enabled": true
  }
}
```

- **Purpose**: Controls how Docker manages its build cache
- **Benefits**:
  - Limits build cache to 20GB to prevent disk space issues
  - Enables automatic garbage collection to clean up unused layers
  - Improves build performance while managing disk usage

### Networking Configuration

```json
"default-address-pools": [
  {
    "base": "192.168.65.0/24",
    "size": 24
  }
]
```

- **Purpose**: Defines the default IP address pools for networks
- **Benefits**:
  - Matches the subnet used in our docker-compose.yml (192.168.65.0/24)
  - Prevents IP address conflicts with other networks
  - Ensures consistent networking across environments

### BuildKit Enablement

```json
"experimental": false,
"features": {
  "buildkit": true
}
```

- **Purpose**: Enables BuildKit, Docker's next-generation build system
- **Benefits**:
  - Faster builds with parallel dependency resolution
  - Better caching for multi-stage builds
  - Improved build output and error messages
  - Enhanced security with secret mounting

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

- **Purpose**: Sets default resource limits for containers
- **Benefits**:
  - Increased shared memory size (2GB) for AI service requirements
  - Higher file descriptor limits for handling many concurrent connections
  - Prevents resource-related crashes in high-load scenarios

### Logging Configuration

```json
"log-driver": "json-file",
"log-opts": {
  "max-size": "50m",
  "max-file": "3"
}
```

- **Purpose**: Controls how container logs are managed
- **Benefits**:
  - Prevents log files from consuming excessive disk space
  - Rotates logs (3 files of 50MB each)
  - Maintains recent logs for troubleshooting while managing storage

### Storage Settings

```json
"storage-driver": "windowsfilter",
"storage-opts": [
  "size=50GB"
]
```

- **Purpose**: Configures Docker's storage driver and options
- **Benefits**:
  - Uses the appropriate storage driver for the platform
  - Limits container filesystem size to prevent disk space issues
  - Improves I/O performance with optimized settings

### Security Enhancements

```json
"no-new-privileges": true,
"selinux-enabled": false,
"userns-remap": ""
```

- **Purpose**: Enhances container security
- **Benefits**:
  - Prevents privilege escalation within containers
  - Aligns with security settings in docker-compose.yml
  - Provides defense-in-depth security approach

### Performance Optimizations

```json
"registry-mirrors": [
  "https://registry-1.docker.io"
],
"max-concurrent-downloads": 5,
"max-concurrent-uploads": 5
```

- **Purpose**: Improves Docker's performance for image operations
- **Benefits**:
  - Faster image pulls with registry mirrors
  - Optimized concurrent operations for better network utilization
  - Balanced resource usage during image operations

## Comparison with Previous Configuration

The previous minimal configuration only included:

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

Our improved configuration adds:
- Network address pool configuration matching the project
- BuildKit enablement for faster builds
- Resource limits appropriate for AI workloads
- Log rotation to prevent disk space issues
- Storage driver optimization
- Security enhancements
- Performance optimizations

## Adjusting for Different Environments

You may need to adjust some settings based on your specific environment:

### For Development Environments

- Consider increasing `defaultKeepStorage` for more build caching
- You might want to enable experimental features for testing
- Adjust resource limits based on your development machine's capabilities

### For Production Environments

- Consider stricter security settings
- Optimize resource limits based on server specifications
- Configure additional registry mirrors for redundancy
- Implement more aggressive log rotation for long-running services

## Troubleshooting

If you encounter issues after applying the configuration:

1. Check Docker logs:
   ```
   # Windows
   Get-EventLog -LogName Application -Source docker -Newest 50
   
   # Linux
   sudo journalctl -u docker
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
