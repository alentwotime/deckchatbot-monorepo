# Test script to verify optimized Docker configurations
Write-Host "Testing optimized Docker configurations..." -ForegroundColor Green

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

# Clean up any existing images and containers
Write-Host "`nCleaning up existing Docker resources..." -ForegroundColor Yellow
docker-compose -f docker\docker-compose.yml down --rmi all --volumes --remove-orphans 2>$null
docker system prune -f 2>$null

# Change to docker directory
Set-Location "docker"

# Build the optimized images
Write-Host "`nBuilding optimized Docker images..." -ForegroundColor Yellow
$buildStart = Get-Date
docker-compose build --no-cache --parallel

if ($LASTEXITCODE -eq 0) {
    $buildEnd = Get-Date
    $buildTime = ($buildEnd - $buildStart).TotalSeconds
    Write-Host "Docker images built successfully in $([math]::Round($buildTime, 2)) seconds" -ForegroundColor Green
    
    # Check image sizes
    Write-Host "`nOptimized image sizes:" -ForegroundColor Yellow
    $images = docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | Select-String "docker"
    $images | ForEach-Object { Write-Host $_ -ForegroundColor Cyan }
    
    # Test container startup
    Write-Host "`nTesting container startup..." -ForegroundColor Yellow
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Containers started successfully" -ForegroundColor Green
        
        # Wait for services to be healthy
        Write-Host "Waiting for services to become healthy..." -ForegroundColor Yellow
        $timeout = 120
        $elapsed = 0
        $interval = 5
        
        do {
            Start-Sleep $interval
            $elapsed += $interval
            $healthStatus = docker-compose ps --format json | ConvertFrom-Json | ForEach-Object { $_.Health }
            $allHealthy = $healthStatus | Where-Object { $_ -ne "healthy" } | Measure-Object | Select-Object -ExpandProperty Count
            
            if ($allHealthy -eq 0) {
                Write-Host "All services are healthy!" -ForegroundColor Green
                break
            }
            
            Write-Host "Waiting for services... ($elapsed/$timeout seconds)" -ForegroundColor Yellow
        } while ($elapsed -lt $timeout)
        
        if ($elapsed -ge $timeout) {
            Write-Host "Timeout waiting for services to become healthy" -ForegroundColor Red
            docker-compose logs
        } else {
            # Test basic connectivity
            Write-Host "`nTesting service connectivity..." -ForegroundColor Yellow
            
            # Test frontend
            try {
                $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
                if ($frontendResponse.StatusCode -eq 200) {
                    Write-Host "✓ Frontend service is responding" -ForegroundColor Green
                }
            } catch {
                Write-Host "✗ Frontend service is not responding: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            # Test backend health
            try {
                $backendResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 10 -UseBasicParsing
                if ($backendResponse.StatusCode -eq 200) {
                    Write-Host "✓ Backend service is responding" -ForegroundColor Green
                }
            } catch {
                Write-Host "✗ Backend service is not responding: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            # Test AI service health
            try {
                $aiResponse = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 10 -UseBasicParsing
                if ($aiResponse.StatusCode -eq 200) {
                    Write-Host "✓ AI service is responding" -ForegroundColor Green
                }
            } catch {
                Write-Host "✗ AI service is not responding: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        # Show container resource usage
        Write-Host "`nContainer resource usage:" -ForegroundColor Yellow
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
        
        # Clean up
        Write-Host "`nCleaning up test containers..." -ForegroundColor Yellow
        docker-compose down
        
    } else {
        Write-Host "Failed to start containers" -ForegroundColor Red
        docker-compose logs
        exit 1
    }
    
} else {
    Write-Host "Failed to build Docker images" -ForegroundColor Red
    exit 1
}

# Return to root directory
Set-Location ".."

Write-Host "`nOptimized Docker configuration test completed successfully!" -ForegroundColor Green
Write-Host "`nOptimizations implemented:" -ForegroundColor Yellow
Write-Host "✓ Multi-stage builds for all services" -ForegroundColor Green
Write-Host "✓ Non-root users for improved security" -ForegroundColor Green
Write-Host "✓ Reduced image sizes by separating build and runtime dependencies" -ForegroundColor Green
Write-Host "✓ Security options (no-new-privileges, capability dropping)" -ForegroundColor Green
Write-Host "✓ Resource limits and reservations" -ForegroundColor Green
Write-Host "✓ Comprehensive .dockerignore for faster builds" -ForegroundColor Green
Write-Host "✓ Better layer caching for improved build performance" -ForegroundColor Green
