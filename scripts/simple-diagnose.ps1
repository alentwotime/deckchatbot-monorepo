# Simple DeckChatbot Diagnosis Script
Write-Host "=== DeckChatbot Issue Diagnosis ===" -ForegroundColor Cyan
Write-Host "Current Directory: $(Get-Location)"

# Check Docker
Write-Host "`n--- Checking Docker ---" -ForegroundColor Yellow
try {
    docker --version
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed or not accessible" -ForegroundColor Red
    exit 1
}

try {
    docker compose version
    Write-Host "✓ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose is not available" -ForegroundColor Red
    exit 1
}

# Check project files
Write-Host "`n--- Checking Project Structure ---" -ForegroundColor Yellow
$files = @("docker\docker-compose.yml", "apps\frontend\Dockerfile", "apps\backend\Dockerfile", "apps\ai-service\Dockerfile")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing: $file" -ForegroundColor Red
    }
}

# Check .env file
Write-Host "`n--- Checking Environment ---" -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ .env file missing" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "  Found .env.example - you may need to copy it to .env" -ForegroundColor Gray
    }
}

# Check Docker services
Write-Host "`n--- Checking Docker Services ---" -ForegroundColor Yellow
Set-Location "docker" -ErrorAction SilentlyContinue
try {
    $output = docker compose ps 2>$null
    if ($output) {
        Write-Host "Docker Compose services:" -ForegroundColor Gray
        docker compose ps
    } else {
        Write-Host "⚠ No Docker services are running" -ForegroundColor Yellow
        Write-Host "  To start services: docker compose up -d" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠ Could not check Docker services status" -ForegroundColor Yellow
}
Set-Location ".." -ErrorAction SilentlyContinue

# Check ports
Write-Host "`n--- Checking Ports ---" -ForegroundColor Yellow
$ports = @(3000, 8000, 8001)
$services = @("Frontend", "Backend", "AI Service")

for ($i = 0; $i -lt $ports.Length; $i++) {
    $port = $ports[$i]
    $service = $services[$i]
    
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "✓ $service responding on port $port" -ForegroundColor Green
        } else {
            Write-Host "✗ $service NOT responding on port $port" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Failed to test $service on port $port" -ForegroundColor Red
    }
}

# Check HTTP endpoints
Write-Host "`n--- Checking HTTP Endpoints ---" -ForegroundColor Yellow
$endpoints = @(
    @{url="http://localhost:3000"; name="Frontend"},
    @{url="http://localhost:8000/health"; name="Backend Health"},
    @{url="http://localhost:8001/health"; name="AI Service Health"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✓ $($endpoint.name) responding (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "✗ $($endpoint.name) not accessible" -ForegroundColor Red
    }
}

# Show recent logs if services are running
Write-Host "`n--- Recent Logs ---" -ForegroundColor Yellow
Set-Location "docker" -ErrorAction SilentlyContinue
try {
    $logs = docker compose logs --tail=5 2>$null
    if ($logs) {
        Write-Host "Recent logs (last 5 lines):" -ForegroundColor Gray
        $logs | ForEach-Object {
            if ($_ -match "error|failed|exception") {
                Write-Host $_ -ForegroundColor Red
            } elseif ($_ -match "warning|warn") {
                Write-Host $_ -ForegroundColor Yellow
            } else {
                Write-Host $_ -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "No logs available" -ForegroundColor Gray
    }
} catch {
    Write-Host "Could not retrieve logs" -ForegroundColor Gray
}
Set-Location ".." -ErrorAction SilentlyContinue

Write-Host "`n=== Diagnosis Complete ===" -ForegroundColor Cyan
Write-Host "If services are not running, try: cd docker && docker compose up -d" -ForegroundColor Gray
Write-Host "If you need help, check the logs: cd docker && docker compose logs" -ForegroundColor Gray
