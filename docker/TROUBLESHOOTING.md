# Docker Startup Troubleshooting Guide

## Issue: Docker Network Creation Hanging

If you're experiencing the issue where Docker Compose gets stuck on "Network docker_decknet Creating" for an extended period (several minutes), this guide will help you resolve it.

## Root Cause Analysis

The main causes of this issue are:

1. **Custom Subnet Conflicts**: The original `docker-compose.yml` uses a custom subnet (`192.168.65.0/24`) that may conflict with existing networks
2. **Complex Dependency Chains**: Health check dependencies can create circular waiting conditions
3. **Resource Constraints**: Strict memory/CPU limits may prevent containers from starting
4. **Port Conflicts**: Services may conflict with existing processes on the same ports

## Quick Fix Steps

### Step 1: Run the Diagnostic Script

```powershell
cd docker
.\fix-docker-network.ps1
```

This script will:
- Check if Docker is running
- Identify port conflicts
- Check system resources
- Test network connectivity
- Offer to clean up problematic networks/containers

### Step 2: Try the Simplified Configuration

If the diagnostic script identifies issues, try the simplified configuration first:

```powershell
docker compose -f docker-compose-simple.yml up --build
```

This removes all complex configurations and uses basic Docker networking.

### Step 3: Use the Improved Configuration

If the simplified version works, try the improved configuration:

```powershell
docker compose -f docker-compose-improved.yml up --build
```

This maintains essential features while fixing the network issues.

### Step 4: Manual Cleanup (if needed)

If you're still having issues, manually clean up Docker:

```powershell
# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove all custom networks
docker network prune -f

# Remove all unused images, containers, networks
docker system prune -a -f

# Restart Docker Desktop
# (Right-click Docker Desktop icon -> Restart)
```

## Configuration Comparison

### Original Issues (docker-compose.yml)
- ❌ Custom subnet: `192.168.65.0/24`
- ❌ Complex health check dependencies
- ❌ Strict resource reservations
- ❌ Security constraints that may interfere with startup

### Improved Version (docker-compose-improved.yml)
- ✅ Default Docker bridge networking
- ✅ Increased health check start periods
- ✅ Reduced resource reservations
- ✅ Proper service startup order

### Simplified Version (docker-compose-simple.yml)
- ✅ Minimal configuration
- ✅ No health checks or dependencies
- ✅ Basic networking only
- ✅ Good for testing and development

## Specific Fixes Applied

### 1. Network Configuration
```yaml
# BEFORE (problematic)
networks:
  decknet:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.65.0/24

# AFTER (fixed)
networks:
  decknet:
    driver: bridge
```

### 2. Health Check Timing
```yaml
# BEFORE (too aggressive)
healthcheck:
  interval: 10s
  timeout: 5s
  start_period: 30s

# AFTER (more reasonable)
healthcheck:
  interval: 30s
  timeout: 10s
  start_period: 60s
```

### 3. Resource Reservations
```yaml
# BEFORE (too strict)
reservations:
  memory: 1G
  cpus: '0.75'

# AFTER (more flexible)
reservations:
  memory: 512M
  cpus: '0.5'
```

## Testing Your Fix

### 1. Test Network Creation
```powershell
# This should complete quickly (under 30 seconds)
docker compose -f docker-compose-improved.yml up --no-start
```

### 2. Test Service Startup
```powershell
# Start services one by one to identify issues
docker compose -f docker-compose-improved.yml up ai-service
# Wait for healthy, then Ctrl+C and start next
docker compose -f docker-compose-improved.yml up ai-service backend
# Wait for healthy, then Ctrl+C and start all
docker compose -f docker-compose-improved.yml up
```

### 3. Monitor Startup Progress
```powershell
# In another terminal, watch the logs
docker compose -f docker-compose-improved.yml logs -f
```

## Prevention Tips

1. **Regular Cleanup**: Run `docker system prune -f` weekly
2. **Monitor Resources**: Check available disk space and memory
3. **Port Management**: Use `netstat -an | findstr :8000` to check port usage
4. **Network Conflicts**: Avoid custom subnets that conflict with your local network

## If Issues Persist

1. **Check Docker Desktop Settings**:
   - Increase memory allocation (Settings -> Resources -> Advanced)
   - Enable "Use the WSL 2 based engine" if on Windows

2. **Check Windows Firewall**:
   - Ensure Docker Desktop is allowed through firewall
   - Temporarily disable firewall to test

3. **Check Antivirus Software**:
   - Add Docker directories to antivirus exclusions
   - Temporarily disable real-time protection to test

4. **Reset Docker Desktop**:
   - Settings -> Troubleshoot -> Reset to factory defaults
   - This will remove all containers, images, and networks

## Success Indicators

You'll know the issue is resolved when:
- ✅ Network creation completes in under 30 seconds
- ✅ All services start and become healthy
- ✅ No error messages in logs
- ✅ Services are accessible on their respective ports

## Getting Help

If you're still experiencing issues after following this guide:

1. Run the diagnostic script and save the output
2. Check the Docker Desktop logs (Settings -> Troubleshoot -> Show logs)
3. Provide the specific error messages and system information

The improved configurations should resolve the network creation hang in most cases.
