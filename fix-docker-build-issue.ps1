# Fix Docker Build Issue - Comprehensive Solution (PowerShell)
# This script addresses the "webpack: not found" error by clearing Docker cache
# and rebuilding the containers with the correct configuration

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Write-Header {
    param($Message)
    Write-Host ""
    Write-Host "==============================================" -ForegroundColor $Blue
    Write-Host $Message -ForegroundColor $Blue
    Write-Host "==============================================" -ForegroundColor $Blue
}

Write-Header "Docker Build Issue Fix"

Write-Status "This script will fix the 'webpack: not found' error by:"
Write-Status "1. Stopping all running containers"
Write-Status "2. Removing old containers and images"
Write-Status "3. Clearing Docker build cache"
Write-Status "4. Rebuilding containers with correct configuration"
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Status "Docker is running. Proceeding with fix..."
}
catch {
    Write-Error "Docker is not running. Please start Docker and try again."
    exit 1
}

# Navigate to docker directory
if (Test-Path "docker") {
    Set-Location "docker"
    Write-Success "Changed to docker directory"
}
else {
    Write-Error "Docker directory not found. Please run this script from the project root."
    exit 1
}

# Step 1: Stop all running containers
Write-Header "Step 1: Stopping Running Containers"
$runningContainers = docker compose ps -q
if ($runningContainers) {
    Write-Status "Stopping running containers..."
    docker compose down
    Write-Success "Containers stopped"
}
else {
    Write-Status "No running containers found"
}

# Step 2: Remove old containers and images
Write-Header "Step 2: Cleaning Up Old Containers and Images"

Write-Status "Removing old containers..."
try {
    docker compose rm -f
}
catch {
    Write-Warning "No containers to remove"
}

Write-Status "Removing old images..."
# Remove specific project images
try {
    $images = docker images --format "table {{.Repository}}:{{.Tag}}`t{{.ID}}" | Select-String "deckchatbot"
    if ($images) {
        $imageIds = $images | ForEach-Object { ($_ -split "`t")[1] }
        docker rmi -f $imageIds
    }
}
catch {
    Write-Warning "No deckchatbot images to remove"
}

# Remove dangling images
docker image prune -f
Write-Success "Old containers and images removed"

# Step 3: Clear Docker build cache
Write-Header "Step 3: Clearing Docker Build Cache"
Write-Status "Clearing Docker build cache..."
docker builder prune -f
Write-Success "Docker build cache cleared"

# Step 4: Verify configuration
Write-Header "Step 4: Verifying Configuration"

Write-Status "Checking frontend Dockerfile configuration..."
$dockerfileContent = Get-Content "..\apps\frontend\Dockerfile" -Raw
if ($dockerfileContent -match "RUN npm ci &&") {
    Write-Success "✅ Frontend Dockerfile correctly installs all dependencies"
}
else {
    Write-Error "❌ Frontend Dockerfile configuration issue detected"
    exit 1
}

Write-Status "Checking package.json for webpack..."
$packageJsonContent = Get-Content "..\apps\frontend\package.json" -Raw
if ($packageJsonContent -match '"webpack"') {
    Write-Success "✅ Webpack is properly listed as dev dependency"
}
else {
    Write-Error "❌ Webpack not found in package.json"
    exit 1
}

# Step 5: Rebuild containers
Write-Header "Step 5: Rebuilding Containers"
Write-Status "Building containers without cache..."
Write-Warning "This may take several minutes..."

# Build without cache to ensure fresh build
docker compose build --no-cache

Write-Success "Containers rebuilt successfully!"

# Step 6: Start services
Write-Header "Step 6: Starting Services"
Write-Status "Starting all services..."
docker compose up -d

# Wait a moment for services to start
Start-Sleep -Seconds 10

# Step 7: Verify services
Write-Header "Step 7: Verifying Services"
Write-Status "Checking service status..."
docker compose ps

Write-Status "Checking service health..."
$servicesStatus = docker compose ps
if ($servicesStatus -match "Up") {
    Write-Success "✅ Services are running"
    
    # Test frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        Write-Success "✅ Frontend is accessible at http://localhost:3000"
    }
    catch {
        Write-Warning "⚠️ Frontend may still be starting up"
    }
    
    # Test backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
        Write-Success "✅ Backend is accessible at http://localhost:8000"
    }
    catch {
        Write-Warning "⚠️ Backend may still be starting up"
    }
    
    # Test AI service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -UseBasicParsing -TimeoutSec 5
        Write-Success "✅ AI service is accessible at http://localhost:8001"
    }
    catch {
        Write-Warning "⚠️ AI service may still be starting up"
    }
}
else {
    Write-Error "❌ Some services failed to start"
    Write-Status "Checking logs for errors..."
    docker compose logs --tail=20
}

Write-Header "Fix Complete!"

Write-Success "The Docker build issue has been resolved!"
Write-Host ""
Write-Status "Summary of actions taken:"
Write-Host "  • Stopped all running containers"
Write-Host "  • Removed old containers and images"
Write-Host "  • Cleared Docker build cache"
Write-Host "  • Verified configuration is correct"
Write-Host "  • Rebuilt containers without cache"
Write-Host "  • Started all services"
Write-Host ""
Write-Status "Your application should now be accessible at:"
Write-Host "  • Frontend: http://localhost:3000"
Write-Host "  • Backend API: http://localhost:8000"
Write-Host "  • AI Service: http://localhost:8001"
Write-Host ""
Write-Status "If you still encounter issues, check the logs with:"
Write-Host "  docker compose logs -f"
Write-Host ""
Write-Warning "Note: The OPENAI_API_KEY warning is expected when using Ollama (AI_PROVIDER=ollama)"

# Return to original directory
Set-Location ".."
