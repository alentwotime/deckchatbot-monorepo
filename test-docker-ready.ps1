# Test if Docker Desktop is ready
# Run this script to check if Docker is properly started and ready for use

Write-Host "Testing Docker Desktop status..." -ForegroundColor Cyan

try {
    # Test Docker connection
    $dockerInfo = docker info 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker Desktop is running and ready!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Docker version information:" -ForegroundColor Yellow
        docker version --format "Client: {{.Client.Version}}, Server: {{.Server.Version}}"
        Write-Host ""
        Write-Host "You can now run the fix script:" -ForegroundColor Green
        Write-Host "  .\fix-docker-build-issue.ps1" -ForegroundColor White
        Write-Host ""
        Write-Host "Or manually fix the build:" -ForegroundColor Green
        Write-Host "  cd docker" -ForegroundColor White
        Write-Host "  docker compose build --no-cache" -ForegroundColor White
        Write-Host "  docker compose up -d" -ForegroundColor White
    } else {
        Write-Host "❌ Docker Desktop is not ready yet" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please:" -ForegroundColor Yellow
        Write-Host "1. Make sure Docker Desktop is started" -ForegroundColor White
        Write-Host "2. Wait for the whale icon to appear in system tray" -ForegroundColor White
        Write-Host "3. Wait for the icon to stop spinning/animating" -ForegroundColor White
        Write-Host "4. Run this script again: .\test-docker-ready.ps1" -ForegroundColor White
        Write-Host ""
        Write-Host "Error details:" -ForegroundColor Red
        Write-Host $dockerInfo -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Docker command failed" -ForegroundColor Red
    Write-Host "Make sure Docker Desktop is installed and started" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
}
