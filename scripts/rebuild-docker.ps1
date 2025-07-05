# PowerShell script to rebuild Docker containers and test the changes

# Stop on first error
$ErrorActionPreference = "Stop"

Write-Host "Stopping existing containers..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\docker"
docker-compose down

Write-Host "Rebuilding containers..." -ForegroundColor Cyan
docker-compose build --no-cache

Write-Host "Starting containers..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "Checking container status..." -ForegroundColor Cyan
docker-compose ps

Write-Host "Checking logs for ai-service..." -ForegroundColor Cyan
docker-compose logs ai-service

Write-Host "Done! Check the logs above for any errors." -ForegroundColor Green
