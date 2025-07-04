# DeckChatbot Issue Diagnosis Script
# This script helps identify what's "not working" in the DeckChatbot deployment

param(
    [switch]$Verbose,
    [switch]$FixCommonIssues
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param($Message, $Color = "White")
    Write-Host "[INFO] $Message" -ForegroundColor $Color
}

function Write-Success {
    param($Message)
    Write-Host "[✓] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param($Message)
    Write-Host "[⚠] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[✗] $Message" -ForegroundColor $Red
}

function Test-Command {
    param($Command)
    try {
        & $Command --version 2>$null | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-Port {
    param($Port, $ServiceName)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Success "$ServiceName is responding on port $Port"
            return $true
        } else {
            Write-Error "$ServiceName is NOT responding on port $Port"
            return $false
        }
    } catch {
        Write-Error "Failed to test $ServiceName on port $Port"
        return $false
    }
}

function Test-HttpEndpoint {
    param($Url, $ServiceName, $ExpectedStatus = 200)
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Success "$ServiceName endpoint $Url is responding (Status: $($response.StatusCode))"
            return $true
        } else {
            Write-Warning "$ServiceName endpoint $Url returned status $($response.StatusCode)"
            return $false
        }
    } catch {
        Write-Error "$ServiceName endpoint $Url is not accessible: $($_.Exception.Message)"
        return $false
    }
}

Write-Status "Starting DeckChatbot Issue Diagnosis..." $Blue
Write-Status "Current Directory: $(Get-Location)"

# Check 1: Prerequisites
Write-Status "`n=== Checking Prerequisites ===" $Blue

$dockerInstalled = Test-Command "docker"
$dockerComposeInstalled = $false

if ($dockerInstalled) {
    Write-Success "Docker is installed"
    try {
        docker compose version 2>$null | Out-Null
        $dockerComposeInstalled = $true
        Write-Success "Docker Compose is installed"
    } catch {
        Write-Error "Docker Compose is not available"
    }
} else {
    Write-Error "Docker is not installed or not in PATH"
}

$gitInstalled = Test-Command "git"
if ($gitInstalled) {
    Write-Success "Git is installed"
} else {
    Write-Warning "Git is not installed or not in PATH"
}

# Check 2: Project Structure
Write-Status "`n=== Checking Project Structure ===" $Blue

$requiredFiles = @(
    "docker\docker-compose.yml",
    "apps\frontend\Dockerfile",
    "apps\backend\Dockerfile", 
    "apps\ai-service\Dockerfile",
    "scripts\deploy-custom.sh"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Success "Found: $file"
    } else {
        Write-Error "Missing: $file"
        $missingFiles += $file
    }
}

# Check 3: Environment Configuration
Write-Status "`n=== Checking Environment Configuration ===" $Blue

if (Test-Path ".env") {
    Write-Success "Found .env file"
    if ($Verbose) {
        Write-Status "Environment variables:"
        Get-Content ".env" | Where-Object { $_ -notmatch "^#" -and $_ -ne "" } | ForEach-Object {
            $parts = $_ -split "=", 2
            if ($parts.Count -eq 2) {
                $key = $parts[0]
                $value = if ($key -match "(KEY|TOKEN|PASSWORD|SECRET)") { "***HIDDEN***" } else { $parts[1] }
                Write-Host "  $key=$value" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Warning ".env file not found"
    if (Test-Path ".env.example") {
        Write-Status "Found .env.example - you may need to copy it to .env"
    }
}

# Check 4: Docker Services Status
Write-Status "`n=== Checking Docker Services ===" $Blue

if ($dockerInstalled -and $dockerComposeInstalled) {
    Set-Location "docker" -ErrorAction SilentlyContinue

    try {
        $services = docker compose ps --format json 2>$null | ConvertFrom-Json
        if ($services) {
            Write-Status "Docker Compose services status:"
            foreach ($service in $services) {
                $status = $service.State
                $health = if ($service.Health) { $service.Health } else { "N/A" }

                if ($status -eq "running" -and ($health -eq "healthy" -or $health -eq "N/A")) {
                    Write-Success "  $($service.Name): $status (Health: $health)"
                } elseif ($status -eq "running") {
                    Write-Warning "  $($service.Name): $status (Health: $health)"
                } else {
                    Write-Error "  $($service.Name): $status (Health: $health)"
                }
            }
        } else {
            Write-Warning "No Docker Compose services are running"
            Write-Status "To start services, run: docker compose up -d"
        }
    } catch {
        Write-Warning "Could not get Docker Compose status. Services may not be running."
    }

    Set-Location ".." -ErrorAction SilentlyContinue
}

# Check 5: Port Accessibility
Write-Status "`n=== Checking Port Accessibility ===" $Blue

$ports = @(
    @{Port=3000; Service="Frontend"},
    @{Port=8000; Service="Backend"},
    @{Port=8001; Service="AI Service"}
)

$portResults = @()
foreach ($portInfo in $ports) {
    $result = Test-Port $portInfo.Port $portInfo.Service
    $portResults += @{Port=$portInfo.Port; Service=$portInfo.Service; Available=$result}
}

# Check 6: HTTP Endpoints
Write-Status "`n=== Checking HTTP Endpoints ===" $Blue

$endpoints = @(
    @{Url="http://localhost:3000"; Service="Frontend"},
    @{Url="http://localhost:8000/health"; Service="Backend Health"},
    @{Url="http://localhost:8001/health"; Service="AI Service Health"}
)

$endpointResults = @()
foreach ($endpoint in $endpoints) {
    $result = Test-HttpEndpoint $endpoint.Url $endpoint.Service
    $endpointResults += @{Url=$endpoint.Url; Service=$endpoint.Service; Available=$result}
}

# Check 7: Recent Logs (if services are running)
Write-Status "`n=== Checking Recent Logs ===" $Blue

if ($dockerInstalled -and $dockerComposeInstalled) {
    Set-Location "docker" -ErrorAction SilentlyContinue

    try {
        $recentLogs = docker compose logs --tail=10 2>$null
        if ($recentLogs) {
            Write-Status "Recent logs (last 10 lines):"
            $recentLogs | ForEach-Object {
                if ($_ -match "(error|failed|exception)" -and $_ -notmatch "health") {
                    Write-Host "  $_" -ForegroundColor $Red
                } elseif ($_ -match "(warning|warn)") {
                    Write-Host "  $_" -ForegroundColor $Yellow
                } else {
                    Write-Host "  $_" -ForegroundColor Gray
                }
            }
        } else {
            Write-Status "No recent logs available"
        }
    } catch {
        Write-Status "Could not retrieve logs"
    }

    Set-Location ".." -ErrorAction SilentlyContinue
}

# Summary and Recommendations
Write-Status "`n=== DIAGNOSIS SUMMARY ===" $Blue

$issues = @()
$recommendations = @()

if (-not $dockerInstalled) {
    $issues += "Docker is not installed"
    $recommendations += "Install Docker Desktop from https://www.docker.com/products/docker-desktop"
}

if (-not $dockerComposeInstalled -and $dockerInstalled) {
    $issues += "Docker Compose is not available"
    $recommendations += "Ensure Docker Compose is installed (usually comes with Docker Desktop)"
}

if ($missingFiles.Count -gt 0) {
    $issues += "Missing required files: $($missingFiles -join ', ')"
    $recommendations += "Ensure you're in the correct project directory and all files are present"
}

if (-not (Test-Path ".env")) {
    $issues += ".env file is missing"
    $recommendations += "Copy .env.example to .env and configure your environment variables"
}

$runningServices = $portResults | Where-Object { $_.Available -eq $true }
if ($runningServices.Count -eq 0) {
    $issues += "No services are running"
    $recommendations += "Start services with: cd docker && docker compose up -d"
}

$workingEndpoints = $endpointResults | Where-Object { $_.Available -eq $true }
if ($workingEndpoints.Count -eq 0 -and $runningServices.Count -gt 0) {
    $issues += "Services are running but not responding to HTTP requests"
    $recommendations += "Check service logs with: cd docker && docker compose logs"
}

if ($issues.Count -eq 0) {
    Write-Success "`nNo major issues detected! Your DeckChatbot appears to be working correctly."
    Write-Status "You can access your application at:"
    Write-Status "  • Frontend: http://localhost:3000"
    Write-Status "  • Backend API: http://localhost:8000"
    Write-Status "  • AI Service: http://localhost:8001"
} else {
    Write-Error "`nIssues detected:"
    foreach ($issue in $issues) {
        Write-Error "  • $issue"
    }

    Write-Status "`nRecommendations:" $Yellow
    foreach ($rec in $recommendations) {
        Write-Status "  • $rec" $Yellow
    }
}

# Quick Fix Options
if ($FixCommonIssues -and $issues.Count -gt 0) {
    Write-Status "`n=== ATTEMPTING QUICK FIXES ===" $Blue

    if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
        Write-Status "Creating .env file from .env.example..."
        Copy-Item ".env.example" ".env"
        Write-Success "Created .env file"
    }

    if ($dockerInstalled -and $dockerComposeInstalled -and $runningServices.Count -eq 0) {
        Write-Status "Attempting to start Docker services..."
        Set-Location "docker" -ErrorAction SilentlyContinue
        try {
            docker compose up -d
            Write-Success "Started Docker services"
            Start-Sleep 10
            Write-Status "Waiting for services to become healthy..."
        } catch {
            Write-Error "Failed to start Docker services: $($_.Exception.Message)"
        }
        Set-Location ".." -ErrorAction SilentlyContinue
    }
}

Write-Status "`nDiagnosis complete!" $Blue
Write-Status "For more detailed troubleshooting, run with -Verbose flag"
Write-Status "To attempt automatic fixes, run with -FixCommonIssues flag"
