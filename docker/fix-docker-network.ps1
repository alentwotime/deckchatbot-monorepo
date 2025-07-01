# Docker Network Diagnostic and Fix Script
Write-Host "[INFO] Docker Network Diagnostic and Fix Script" -ForegroundColor Green

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        # Try different API versions to handle compatibility issues
        $apiVersions = @("1.41", "1.40", "1.39", "1.38", "1.35")

        foreach ($version in $apiVersions) {
            $env:DOCKER_API_VERSION = $version
            $result = docker version --format "{{.Client.Version}}" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[INFO] Docker is running with API version $version" -ForegroundColor Green
                return $true
            }
        }

        # If all API versions fail, check if it's a service issue
        $dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
        if ($dockerService -and $dockerService.Status -ne "Running") {
            Write-Host "[WARNING] Docker Desktop Service is not running. Run fix-docker-admin.ps1 as Administrator to fix this." -ForegroundColor Yellow
        }

        return $false
    }
    catch {
        return $false
    }
}

# Function to clean up Docker networks
function Clear-DockerNetworks {
    Write-Host "[INFO] Cleaning up Docker networks..." -ForegroundColor Yellow

    # Stop all containers
    Write-Host "Stopping all containers..."
    docker stop $(docker ps -aq) 2>$null

    # Remove all containers
    Write-Host "Removing all containers..."
    docker rm $(docker ps -aq) 2>$null

    # Remove custom networks (keep default ones)
    Write-Host "Removing custom networks..."
    $networks = docker network ls --format "{{.Name}}" | Where-Object { $_ -notin @("bridge", "host", "none") }
    foreach ($network in $networks) {
        try {
            docker network rm $network 2>$null
            Write-Host "Removed network: $network" -ForegroundColor Green
        }
        catch {
            Write-Host "Could not remove network: $network" -ForegroundColor Yellow
        }
    }

    # Prune networks
    Write-Host "Pruning unused networks..."
    docker network prune -f
}

# Function to check for port conflicts
function Test-PortConflicts {
    Write-Host "[INFO] Checking for port conflicts..." -ForegroundColor Yellow

    $ports = @(3000, 8000, 8001)
    $conflicts = @()

    foreach ($port in $ports) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            $conflicts += $port
            Write-Host "Port $port is in use by process ID: $($connection.OwningProcess)" -ForegroundColor Red
        }
    }

    if ($conflicts.Count -gt 0) {
        Write-Host "Port conflicts detected on ports: $($conflicts -join ', ')" -ForegroundColor Red
        Write-Host "Consider stopping processes using these ports or changing port mappings." -ForegroundColor Yellow
        return $false
    }
    else {
        Write-Host "No port conflicts detected." -ForegroundColor Green
        return $true
    }
}

# Function to check Docker system resources
function Test-DockerResources {
    Write-Host "[INFO] Checking Docker system resources..." -ForegroundColor Yellow

    try {
        $info = docker system df
        Write-Host "Docker system usage:" -ForegroundColor Green
        $info

        # Check available disk space
        $dockerRoot = docker info --format "{{.DockerRootDir}}" 2>$null
        if ($dockerRoot) {
            $drive = Split-Path -Qualifier $dockerRoot
            $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='$drive'"
            $freeSpaceGB = [math]::Round($disk.FreeSpace / 1GB, 2)

            if ($freeSpaceGB -lt 5) {
                Write-Host "Warning: Low disk space ($freeSpaceGB GB free). Docker may have issues." -ForegroundColor Red
                return $false
            }
            else {
                Write-Host "Disk space OK: $freeSpaceGB GB free" -ForegroundColor Green
            }
        }

        return $true
    }
    catch {
        Write-Host "Could not check Docker resources: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test network connectivity
function Test-NetworkConnectivity {
    Write-Host "[INFO] Testing network connectivity..." -ForegroundColor Yellow

    # Test internet connectivity
    try {
        $response = Test-NetConnection -ComputerName "8.8.8.8" -Port 53 -InformationLevel Quiet
        if ($response) {
            Write-Host "Internet connectivity: OK" -ForegroundColor Green
        }
        else {
            Write-Host "Internet connectivity: FAILED" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "Could not test internet connectivity" -ForegroundColor Yellow
    }

    return $true
}

# Main execution
Write-Host "Starting Docker diagnostics..." -ForegroundColor Cyan

# Check if Docker is running
if (-not (Test-DockerRunning)) {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Docker is running" -ForegroundColor Green

# Run diagnostics
$portCheck = Test-PortConflicts
$resourceCheck = Test-DockerResources
$networkCheck = Test-NetworkConnectivity

# If any checks failed, offer to clean up
if (-not $portCheck -or -not $resourceCheck -or -not $networkCheck) {
    Write-Host ""
    Write-Host "[WARNING] Some issues detected. Would you like to clean up Docker networks and containers? (y/n)" -ForegroundColor Yellow
    $response = Read-Host

    if ($response -eq 'y' -or $response -eq 'Y') {
        Clear-DockerNetworks
        Write-Host "[INFO] Cleanup completed. You can now try starting your services again." -ForegroundColor Green
    }
}
else {
    Write-Host ""
    Write-Host "[SUCCESS] All diagnostics passed. Your Docker environment looks healthy." -ForegroundColor Green
}

Write-Host ""
Write-Host "To test the simplified configuration, run:" -ForegroundColor Cyan
Write-Host "docker compose -f docker-compose-simple.yml up --build" -ForegroundColor White
Write-Host ""
Write-Host "To start with the original configuration, run:" -ForegroundColor Cyan
Write-Host "docker compose up --build" -ForegroundColor White
