# Disk Space Management for Azure Deployment

This document explains how the deployment script handles disk space issues and provides guidance for managing disk space on your Azure VM.

## Overview

The `deploy-azure.sh` script has been enhanced with disk space management features to prevent failures due to insufficient disk space. These enhancements include:

1. **Disk space checks** before critical operations
2. **Automatic cleanup** when low disk space is detected
3. **Error handling and retry logic** for operations that might fail due to disk space issues

## Automatic Disk Space Management

The deployment script now automatically:

- Checks available disk space before starting deployment
- Performs cleanup operations when low disk space is detected
- Retries failed operations after cleanup
- Provides clear error messages related to disk space issues

### Command-Line Options

The `deploy-azure.sh` script now supports the following command-line options:

```bash
# Show help message
sudo ./scripts/deploy-azure.sh --help

# Run disk cleanup only (without deployment)
sudo ./scripts/deploy-azure.sh --cleanup

# Run in test mode (for testing disk space handling)
sudo ./scripts/deploy-azure.sh --test-mode
```

The `--cleanup` option is particularly useful when you need to free up disk space before running the full deployment.

## Disk Space Requirements

For a successful deployment, the script requires:

- At least **1GB** of free space before starting the deployment
- At least **512MB** of free space for package updates and installations
- At least **2GB** of free space for Docker operations

If these requirements are not met, the script will attempt to free up space automatically.

## Manual Disk Space Management

If the automatic cleanup doesn't free up enough space, you may need to perform manual cleanup:

### 1. Check Current Disk Usage

```bash
df -h
```

### 2. Find Large Files and Directories

```bash
# Find large files (>100MB)
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null | sort -rh

# Find largest directories
du -h --max-depth=1 /var | sort -rh | head -10
```

### 3. Common Cleanup Operations

```bash
# Clean package cache
sudo apt clean
sudo apt autoremove -y

# Remove old log files
sudo find /var/log -type f -name "*.gz" -delete

# Clean Docker resources
sudo docker system prune -af --volumes

# Clean journal logs
sudo journalctl --vacuum-time=3d
```

## Testing Disk Space Handling

A test script is provided to simulate various scenarios that might occur during deployment:

```bash
sudo bash scripts/test-disk-space.sh
```

The script offers several test scenarios:

1. **Low disk space test**: Fills disk space to leave only 100MB free
2. **Normal apt lock test**: Simulates a normal apt process that will complete naturally
3. **Stuck apt lock test**: Simulates an apt process that will never complete
4. **Zombie apt process test**: Simulates a zombie apt process
5. **Termination-resistant apt process test**: Simulates a process that ignores SIGTERM signals
6. **Combined test**: Simulates both low disk space and a stuck apt process

Each test will:
1. Set up the test conditions
2. Simulate what would happen when running the deployment script
3. Clean up after testing

The **termination-resistant apt process test** is particularly useful for testing the new process termination options, as it creates a process that:
- Holds a lock on /var/lib/dpkg/lock
- Ignores normal termination signals (SIGTERM)
- Can only be killed with SIGKILL

**Note**: Use this script only in a test environment, not in production.

## Handling APT Lock Issues

The deployment script now includes enhanced handling for APT lock file issues:

1. **Intelligent process detection** with improved filtering to avoid false positives
2. **Activity monitoring** that detects truly stuck processes vs. normal long-running operations
3. **Interactive recovery options** when a process is detected as stuck
4. **Detailed diagnostics** showing exactly which processes and lock files are involved

### How It Works

When the script detects apt/dpkg processes running:

1. It monitors the processes for activity changes
2. After 60 seconds of no activity, it considers the process potentially stuck
3. It provides detailed information about the processes and lock files
4. It offers interactive options to resolve the situation

### Interactive Recovery Options

If a process is detected as stuck, you'll see these options:

```
Options:
1. Continue waiting
2. Proceed anyway (may cause issues)
3. Abort deployment
4. Try to fix apt (experimental)
```

Each option does the following:

- **Continue waiting**: Resets the inactivity timer and continues monitoring
- **Proceed anyway**: Continues the deployment, skipping operations that require apt
- **Abort deployment**: Exits the script cleanly
- **Try to fix apt**: Attempts automatic recovery for common issues:
  - Detecting and removing stale lock files
  - Running `dpkg --configure -a` to fix interrupted installations
  - Identifying defunct processes still holding locks
  - **NEW**: Offering to terminate processes that are still running and holding locks

### Process Termination Options

When a process is detected as still running and holding a lock, the script now offers options to terminate it:

1. **Normal termination** (SIGTERM):
   ```
   Would you like to attempt to terminate this process? (y/n):
   ```
   If you select 'y', the script will:
   - Send a SIGTERM signal to the process
   - Wait up to 10 seconds for it to exit gracefully
   - Clean up lock files if termination is successful

2. **Force kill** (SIGKILL) for resistant processes:
   ```
   Would you like to force kill this process? (y/n):
   ```
   If a process doesn't respond to normal termination, you'll be offered this option to:
   - Send a SIGKILL signal to the process (cannot be ignored)
   - Clean up lock files after the process is terminated

**Note**: Use the force kill option with caution, as it may leave the system in an inconsistent state. It should only be used when normal termination fails and the process is definitely stuck.

### Manual Resolution of APT Lock Issues

If the automatic and interactive options don't resolve the issue:

```bash
# Get detailed information about apt processes and lock files
ps aux | grep -E "apt-get|dpkg|apt " | grep -v grep

# Check all relevant lock files
ls -l /var/lib/apt/lists/lock /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend /var/cache/apt/archives/lock

# Find processes holding specific lock files
sudo lsof /var/lib/apt/lists/lock
sudo lsof /var/lib/dpkg/lock

# If safe to do so, terminate a specific process
sudo kill <PID>

# Check if any package installations were interrupted
sudo dpkg --configure -a

# As a last resort (use with caution!)
sudo kill -9 <PID>
```

**Warning**: Never delete lock files manually unless you're absolutely certain no apt processes are running. Always try to let processes complete or terminate them properly first.

## Emergency Disk Space Cleanup

For critically low disk space situations (less than 256MB free), the script performs emergency cleanup:

1. **Clearing additional caches** beyond standard cleanup
2. **Removing temporary files** across the system
3. **Truncating log files** rather than deleting them
4. **Cleaning build artifacts** from the repository

You can trigger emergency cleanup manually:

```bash
sudo ./scripts/deploy-azure.sh --cleanup
```

## Troubleshooting

If you encounter disk space issues during deployment:

1. **Check error messages** for specific disk space warnings
2. **Run cleanup operations** manually using the commands above
3. **Check for APT lock issues** using the commands in the APT lock section
4. **Restart the deployment script** after freeing up space

## Azure VM Disk Expansion

If you consistently run out of disk space, consider expanding your VM's disk:

1. Stop the VM in the Azure portal
2. Go to Disks → OS disk → Size + performance
3. Increase the disk size
4. Start the VM
5. Resize the partition and filesystem:

```bash
sudo apt update
sudo apt install -y cloud-guest-utils
sudo growpart /dev/sda 1
sudo resize2fs /dev/sda1
```

## Docker Build Optimization

The Docker build process can consume significant disk space, especially when building images with large dependencies. The following optimizations have been implemented in our Dockerfiles to reduce disk space usage:

### AI Service Dockerfile Optimizations

1. **Cleanup during build stage**:
   ```dockerfile
   # Clean pip cache to reduce disk space usage
   pip cache purge && \
   # Remove unnecessary files to reduce image size
   find /usr/local/lib/python3.11/site-packages -name "*.pyc" -delete && \
   find /usr/local/lib/python3.11/site-packages -name "__pycache__" -exec rm -rf {} +
   ```

2. **Selective package copying**:
   Instead of copying the entire site-packages directory from the builder stage to the production stage, we now selectively copy only the necessary packages:
   ```dockerfile
   # Copy only the necessary packages instead of the entire site-packages directory
   COPY --from=builder /usr/local/lib/python3.11/site-packages/fastapi /usr/local/lib/python3.11/site-packages/fastapi
   COPY --from=builder /usr/local/lib/python3.11/site-packages/pydantic /usr/local/lib/python3.11/site-packages/pydantic
   # ... other necessary packages
   ```

### General Docker Build Tips

1. **Use multi-stage builds** to keep final images small
2. **Clean up in the same RUN instruction** where packages are installed
3. **Use .dockerignore** to prevent unnecessary files from being included in the build context
4. **Run `docker system prune` regularly** to clean up unused images, containers, and build cache

### Troubleshooting Docker Build Failures

If you encounter "no space left on device" errors during Docker builds:

1. Run `docker system df` to check Docker's disk usage
2. Clean up Docker resources with `docker system prune -af --volumes`
3. If building locally, ensure your host system has sufficient disk space
4. Consider using the selective package copying approach for Python dependencies
5. For CI/CD environments, increase the disk space allocation if possible

## Best Practices

- Regularly monitor disk space usage with `df -h`
- Set up automated cleanup tasks using cron jobs
- Consider using a larger VM size for production deployments
- Implement log rotation for application logs
- Run `docker system prune` regularly to clean up Docker resources
