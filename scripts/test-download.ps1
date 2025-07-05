# Test script to verify the download command works
# This script will download the deploy-azure.sh file but won't execute it

Write-Host "Testing download of deploy-azure.sh from GitHub..." -ForegroundColor Cyan

try {
    # Remove any existing file to ensure a clean test
    if (Test-Path "deploy-azure.sh") {
        Remove-Item "deploy-azure.sh" -Force
        Write-Host "Removed existing deploy-azure.sh file" -ForegroundColor Yellow
    }

    # Download the file using Invoke-WebRequest
    Write-Host "Downloading from AlenTwoTime's repository..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/AlenTwoTime/deckchatbot-monorepo/main/scripts/deploy-azure.sh" -OutFile "deploy-azure.sh"
    
    # Check if the file was downloaded successfully
    if (Test-Path "deploy-azure.sh") {
        $fileSize = (Get-Item "deploy-azure.sh").Length
        Write-Host "✅ File downloaded successfully! Size: $fileSize bytes" -ForegroundColor Green
        
        # Display the first few lines of the file to verify content
        Write-Host "First 5 lines of the file:" -ForegroundColor Cyan
        Get-Content "deploy-azure.sh" -TotalCount 5 | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    } else {
        Write-Host "❌ Failed to download the file" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error occurred during download: $_" -ForegroundColor Red
}

Write-Host "`nTest completed. If successful, you can use this command in PowerShell:" -ForegroundColor Cyan
Write-Host "Invoke-WebRequest -Uri https://raw.githubusercontent.com/AlenTwoTime/deckchatbot-monorepo/main/scripts/deploy-azure.sh -OutFile deploy-azure.sh" -ForegroundColor White
Write-Host "bash deploy-azure.sh" -ForegroundColor White
