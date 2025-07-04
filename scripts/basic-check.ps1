Write-Host "=== DeckChatbot Basic Diagnosis ===" -ForegroundColor Cyan

Write-Host "`nChecking Docker..." -ForegroundColor Yellow
docker --version
docker compose version

Write-Host "`nChecking project files..." -ForegroundColor Yellow
if (Test-Path "docker\docker-compose.yml") { Write-Host "✓ docker-compose.yml found" -ForegroundColor Green } else { Write-Host "✗ docker-compose.yml missing" -ForegroundColor Red }
if (Test-Path "apps\frontend\Dockerfile") { Write-Host "✓ Frontend Dockerfile found" -ForegroundColor Green } else { Write-Host "✗ Frontend Dockerfile missing" -ForegroundColor Red }
if (Test-Path "apps\backend\Dockerfile") { Write-Host "✓ Backend Dockerfile found" -ForegroundColor Green } else { Write-Host "✗ Backend Dockerfile missing" -ForegroundColor Red }
if (Test-Path "apps\ai-service\Dockerfile") { Write-Host "✓ AI Service Dockerfile found" -ForegroundColor Green } else { Write-Host "✗ AI Service Dockerfile missing" -ForegroundColor Red }

Write-Host "`nChecking environment..." -ForegroundColor Yellow
if (Test-Path ".env") { Write-Host "✓ .env file exists" -ForegroundColor Green } else { Write-Host "⚠ .env file missing" -ForegroundColor Yellow }

Write-Host "`nChecking Docker services..." -ForegroundColor Yellow
Set-Location "docker"
docker compose ps
Set-Location ".."

Write-Host "`nTesting ports..." -ForegroundColor Yellow
$connection3000 = Test-NetConnection -ComputerName "localhost" -Port 3000 -WarningAction SilentlyContinue
if ($connection3000.TcpTestSucceeded) { Write-Host "✓ Port 3000 (Frontend) is open" -ForegroundColor Green } else { Write-Host "✗ Port 3000 (Frontend) is closed" -ForegroundColor Red }

$connection8000 = Test-NetConnection -ComputerName "localhost" -Port 8000 -WarningAction SilentlyContinue
if ($connection8000.TcpTestSucceeded) { Write-Host "✓ Port 8000 (Backend) is open" -ForegroundColor Green } else { Write-Host "✗ Port 8000 (Backend) is closed" -ForegroundColor Red }

$connection8001 = Test-NetConnection -ComputerName "localhost" -Port 8001 -WarningAction SilentlyContinue
if ($connection8001.TcpTestSucceeded) { Write-Host "✓ Port 8001 (AI Service) is open" -ForegroundColor Green } else { Write-Host "✗ Port 8001 (AI Service) is closed" -ForegroundColor Red }

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "If ports are closed, services are not running." -ForegroundColor Gray
Write-Host "To start services: cd docker && docker compose up -d" -ForegroundColor Gray
Write-Host "To check logs: cd docker && docker compose logs" -ForegroundColor Gray
