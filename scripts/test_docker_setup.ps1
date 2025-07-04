# Test script to verify current Docker setup
Write-Host "Testing current Docker setup..." -ForegroundColor Green

# Check if Docker is available
try {
    docker --version
    Write-Host "Docker is available" -ForegroundColor Green
} catch {
    Write-Host "Docker is not available. Please install Docker first." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version
    Write-Host "Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "Docker Compose is not available. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Change to docker directory
Set-Location "docker"

# Build and test the services
Write-Host "Building Docker images..." -ForegroundColor Yellow
docker-compose build --no-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker images built successfully" -ForegroundColor Green
    
    # Check image sizes
    Write-Host "`nCurrent image sizes:" -ForegroundColor Yellow
    docker images | Select-String "docker"
    
} else {
    Write-Host "Failed to build Docker images" -ForegroundColor Red
    exit 1
}

# Return to root directory
Set-Location ".."

Write-Host "`nDocker setup test completed" -ForegroundColor Green
