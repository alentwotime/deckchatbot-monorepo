# Docker Admin Fix Script - Run as Administrator
# This script must be run as Administrator to fix Docker service issues

Write-Host "[INFO] Docker Admin Fix Script" -ForegroundColor Green
Write-Host "This script fixes Docker service issues and must run as Administrator" -ForegroundColor Yellow

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Host ""
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternatively, you can manually fix Docker by:" -ForegroundColor Cyan
    Write-Host "1. Right-click Docker Desktop icon in system tray" -ForegroundColor White
    Write-Host "2. Select 'Restart Docker Desktop'" -ForegroundColor White
    Write-Host "3. Wait for Docker to fully start (green icon)" -ForegroundColor White
    Write-Host "4. Run: docker context use default" -ForegroundColor White
    Write-Host "5. Run: `$env:DOCKER_API_VERSION='1.41'; docker ps" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Docker Admin Fix - Running as Administrator" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Step 1: Check Docker service status
Write-Host ""
Write-Host "Step 1: Checking Docker service status..." -ForegroundColor Cyan
$dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue

if ($dockerService) {
    Write-Host "Docker service status: $($dockerService.Status)" -ForegroundColor Yellow
    
    if ($dockerService.Status -ne "Running") {
        Write-Host "Starting Docker Desktop Service..." -ForegroundColor Yellow
        try {
            Start-Service com.docker.service
            Write-Host "✅ Docker service started successfully!" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Failed to start Docker service: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "✅ Docker service is already running" -ForegroundColor Green
    }
}
else {
    Write-Host "⚠️ Docker Desktop Service not found. Docker may not be installed properly." -ForegroundColor Yellow
}

# Step 2: Restart Docker Desktop completely
Write-Host ""
Write-Host "Step 2: Restarting Docker Desktop completely..." -ForegroundColor Cyan

try {
    # Stop all Docker processes
    Write-Host "Stopping all Docker processes..."
    Get-Process | Where-Object {$_.ProcessName -like "*docker*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Wait for processes to stop
    Start-Sleep -Seconds 10
    
    # Start Docker Desktop
    Write-Host "Starting Docker Desktop..."
    $dockerPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        Write-Host "✅ Docker Desktop started" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Docker Desktop executable not found at: $dockerPath" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error restarting Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Wait for Docker to initialize and test
Write-Host ""
Write-Host "Step 3: Waiting for Docker to initialize..." -ForegroundColor Cyan
Write-Host "This may take 1-2 minutes..." -ForegroundColor Yellow

$timeout = 120  # 2 minutes
$elapsed = 0
$dockerWorking = $false

while ($elapsed -lt $timeout -and -not $dockerWorking) {
    Start-Sleep -Seconds 10
    $elapsed += 10
    
    Write-Host "Testing Docker... ($elapsed/$timeout seconds)" -ForegroundColor Yellow
    
    # Test different API versions
    $apiVersions = @("1.41", "1.40", "1.39", "1.38", "1.35")
    
    foreach ($version in $apiVersions) {
        try {
            $env:DOCKER_API_VERSION = $version
            $result = docker version --format "{{.Client.Version}}" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Docker is working with API version $version!" -ForegroundColor Green
                Write-Host "Docker client version: $result" -ForegroundColor Green
                
                # Test container listing
                docker ps 2>$null | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Docker container operations working!" -ForegroundColor Green
                    $dockerWorking = $true
                    
                    # Create environment setup
                    Write-Host ""
                    Write-Host "Creating environment setup..." -ForegroundColor Cyan
                    
                    $batchContent = @"
@echo off
echo Setting Docker environment variables...
set DOCKER_API_VERSION=$version
docker context use default
echo Docker API Version: %DOCKER_API_VERSION%
echo Docker Context: default
echo.
echo Docker is now ready to use!
echo Test with: docker ps
"@
                    
                    $batchPath = "set-docker-env.bat"
                    $batchContent | Out-File -FilePath $batchPath -Encoding ASCII
                    
                    Write-Host "✅ Created environment setup script: $batchPath" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "===============================================" -ForegroundColor Cyan
                    Write-Host "SUCCESS! Docker is now working properly" -ForegroundColor Green
                    Write-Host "===============================================" -ForegroundColor Cyan
                    Write-Host ""
                    Write-Host "To use Docker in new PowerShell sessions:" -ForegroundColor Yellow
                    Write-Host "1. Run: .\set-docker-env.bat" -ForegroundColor White
                    Write-Host "2. Or manually set: `$env:DOCKER_API_VERSION='$version'" -ForegroundColor White
                    Write-Host "3. Test with: docker ps" -ForegroundColor White
                    
                    break
                }
            }
        }
        catch {
            # Continue testing other versions
        }
    }
    
    if ($dockerWorking) {
        break
    }
}

if (-not $dockerWorking) {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host "Docker is still not responding after restart" -ForegroundColor Red
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Additional troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check Docker Desktop settings (Settings -> General)" -ForegroundColor White
    Write-Host "2. Try switching Docker Desktop to Windows containers" -ForegroundColor White
    Write-Host "3. Reset Docker Desktop (Settings -> Troubleshoot -> Reset to factory defaults)" -ForegroundColor White
    Write-Host "4. Restart your computer" -ForegroundColor White
    Write-Host "5. Reinstall Docker Desktop if necessary" -ForegroundColor White
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Docker Admin Fix Complete" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
