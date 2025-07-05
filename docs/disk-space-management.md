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

A test script is provided to simulate low disk space scenarios:

```bash
sudo bash scripts/test-disk-space.sh
```

This script will:
1. Fill disk space to leave only 100MB free
2. Simulate running the deployment script
3. Clean up after testing

**Note**: Use this script only in a test environment, not in production.

## Troubleshooting

If you encounter disk space issues during deployment:

1. **Check error messages** for specific disk space warnings
2. **Run cleanup operations** manually using the commands above
3. **Restart the deployment script** after freeing up space

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

## Best Practices

- Regularly monitor disk space usage with `df -h`
- Set up automated cleanup tasks using cron jobs
- Consider using a larger VM size for production deployments
- Implement log rotation for application logs
