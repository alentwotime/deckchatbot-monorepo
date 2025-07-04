# Docker API Fix Script
Write-Host "[INFO] Docker API Fix Script" -ForegroundColor Green
Write-Host "This script will fix Docker API connectivity issues" -ForegroundColor Yellow

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to restart Docker Desktop
function Restart-DockerDesktop {
    Write-Host "[INFO] Restarting Docker Desktop..." -ForegroundColor Yellow
    
    try {
        # Stop Docker Desktop processes
        Write-Host "Stopping Docker Desktop processes..."
        Get-Process | Where-Object {$_.ProcessName -like "*docker*"} | Stop-Process -Force -ErrorAction SilentlyContinue
        
        # Wait a moment for processes to stop
        Start-Sleep -Seconds 5
        
        # Start Docker Desktop
        Write-Host "Starting Docker Desktop..."
        $dockerPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerPath) {
            Start-Process $dockerPath
            Write-Host "Docker Desktop started. Waiting for it to initialize..." -ForegroundColor Green
            
            # Wait for Docker to start (up to 60 seconds)
            $timeout = 60
            $elapsed = 0
            while ($elapsed -lt $timeout) {
                Start-Sleep -Seconds 5
                $elapsed += 5
                
                try {
                    # Try a simple docker command
                    $env:DOCKER_API_VERSION = "1.41"
                    docker version --format "{{.Client.Version}}" 2>$null | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "Docker is now responding!" -ForegroundColor Green
                        return $true
                    }
                }
                catch {
                    # Continue waiting
                }
                
                Write-Host "Waiting for Docker to start... ($elapsed/$timeout seconds)" -ForegroundColor Yellow
            }
            
            Write-Host "Docker Desktop may still be starting. Please wait a few more minutes." -ForegroundColor Yellow
            return $false
        }
        else {
            Write-Host "Docker Desktop executable not found at: $dockerPath" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "Error restarting Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to fix Docker context
function Fix-DockerContext {
    Write-Host "[INFO] Fixing Docker context..." -ForegroundColor Yellow
    
    try {
        # Switch to default context
        docker context use default 2>$null
        Write-Host "Switched to default Docker context" -ForegroundColor Green
        
        # Set a compatible API version
        $env:DOCKER_API_VERSION = "1.41"
        Write-Host "Set Docker API version to 1.41" -ForegroundColor Green
        
        return $true
    }
    catch {
        Write-Host "Error fixing Docker context: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test Docker functionality
function Test-DockerFunctionality {
    Write-Host "[INFO] Testing Docker functionality..." -ForegroundColor Yellow
    
    # Test different API versions
    $apiVersions = @("1.41", "1.40", "1.39", "1.38")
    
    foreach ($version in $apiVersions) {
        Write-Host "Testing API version $version..." -ForegroundColor Cyan
        $env:DOCKER_API_VERSION = $version
        
        try {
            $result = docker version --format "{{.Client.Version}}" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ API version $version works!" -ForegroundColor Green
                Write-Host "Docker client version: $result" -ForegroundColor Green
                
                # Test container listing
                try {
                    docker ps --format "table {{.Names}}\t{{.Status}}" 2>$null | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "✅ Container listing works!" -ForegroundColor Green
                        return $version
                    }
                }
                catch {
                    Write-Host "⚠️ Container listing failed with API $version" -ForegroundColor Yellow
                }
            }
        }
        catch {
            Write-Host "❌ API version $version failed" -ForegroundColor Red
        }
    }
    
    return $null
}

# Function to create Docker environment setup
function Set-DockerEnvironment {
    param($apiVersion)
    
    Write-Host "[INFO] Setting up Docker environment..." -ForegroundColor Yellow
    
    # Create a batch file to set environment variables
    $batchContent = @"
@echo off
echo Setting Docker environment variables...
set DOCKER_API_VERSION=$apiVersion
set DOCKER_CLI_EXPERIMENTAL=enabled
echo Docker API Version: %DOCKER_API_VERSION%
echo Docker CLI Experimental: %DOCKER_CLI_EXPERIMENTAL%
echo.
echo You can now use Docker commands normally.
echo To make these settings permanent, add them to your system environment variables.
"@
    
    $batchPath = "docker\set-docker-env.bat"
    $batchContent | Out-File -FilePath $batchPath -Encoding ASCII
    
    Write-Host "Created environment setup script: $batchPath" -ForegroundColor Green
    Write-Host "Run this script before using Docker commands." -ForegroundColor Yellow
}

# Main execution
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Docker API Issue Diagnosis and Fix" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Check if running as administrator
if (-not (Test-Administrator)) {
    Write-Host ""
    Write-Host "[WARNING] This script is not running as Administrator." -ForegroundColor Yellow
    Write-Host "Some operations may fail. Consider running as Administrator for best results." -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Test current Docker state
Write-Host ""
Write-Host "Step 1: Testing current Docker state..." -ForegroundColor Cyan
$workingVersion = Test-DockerFunctionality

if ($workingVersion) {
    Write-Host ""
    Write-Host "[SUCCESS] Docker is working with API version $workingVersion!" -ForegroundColor Green
    Set-DockerEnvironment -apiVersion $workingVersion
}
else {
    Write-Host ""
    Write-Host "[ERROR] Docker is not responding. Attempting to fix..." -ForegroundColor Red
    
    # Step 2: Fix Docker context
    Write-Host ""
    Write-Host "Step 2: Fixing Docker context..." -ForegroundColor Cyan
    Fix-DockerContext
    
    # Step 3: Restart Docker Desktop
    Write-Host ""
    Write-Host "Step 3: Restarting Docker Desktop..." -ForegroundColor Cyan
    $restartSuccess = Restart-DockerDesktop
    
    if ($restartSuccess) {
        # Step 4: Test again
        Write-Host ""
        Write-Host "Step 4: Testing Docker after restart..." -ForegroundColor Cyan
        $workingVersion = Test-DockerFunctionality
        
        if ($workingVersion) {
            Write-Host ""
            Write-Host "[SUCCESS] Docker is now working with API version $workingVersion!" -ForegroundColor Green
            Set-DockerEnvironment -apiVersion $workingVersion
        }
        else {
            Write-Host ""
            Write-Host "[ERROR] Docker is still not responding after restart." -ForegroundColor Red
            Write-Host "Please try the following manual steps:" -ForegroundColor Yellow
            Write-Host "1. Close Docker Desktop completely" -ForegroundColor White
            Write-Host "2. Restart your computer" -ForegroundColor White
            Write-Host "3. Start Docker Desktop as Administrator" -ForegroundColor White
            Write-Host "4. Run this script again" -ForegroundColor White
        }
    }
    else {
        Write-Host ""
        Write-Host "[ERROR] Failed to restart Docker Desktop." -ForegroundColor Red
        Write-Host "Please manually restart Docker Desktop and run this script again." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Docker API Fix Complete" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
