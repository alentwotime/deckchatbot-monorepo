# Docker Admin Fix Wrapper Script
# This script calls the fix-docker-admin.ps1 script in the docker directory

Write-Host "[INFO] Docker Admin Fix Wrapper Script" -ForegroundColor Green
Write-Host "This script will run the Docker fix script with administrator privileges" -ForegroundColor Yellow

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Path to the actual fix script
$scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "docker\fix-docker-admin.ps1"

# Check if the script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host ""
    Write-Host "[ERROR] Could not find the Docker fix script at: $scriptPath" -ForegroundColor Red
    Write-Host "Please make sure the repository is properly cloned and the docker directory exists." -ForegroundColor Yellow
    exit 1
}

# If not running as admin, restart with admin privileges
if (-not (Test-Administrator)) {
    Write-Host ""
    Write-Host "[INFO] This script requires administrator privileges." -ForegroundColor Yellow
    Write-Host "Attempting to restart with administrator privileges..." -ForegroundColor Yellow
    
    try {
        Start-Process PowerShell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
        exit 0
    }
    catch {
        Write-Host ""
        Write-Host "[ERROR] Failed to restart with administrator privileges." -ForegroundColor Red
        Write-Host "Please right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Alternatively, you can run the script directly:" -ForegroundColor Cyan
        Write-Host "1. Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor White
        Write-Host "2. Navigate to the docker directory: cd docker" -ForegroundColor White
        Write-Host "3. Run the script: .\fix-docker-admin.ps1" -ForegroundColor White
        exit 1
    }
}
else {
    # Running as admin, execute the actual script
    Write-Host ""
    Write-Host "[INFO] Running Docker fix script with administrator privileges..." -ForegroundColor Green
    Write-Host ""
    
    try {
        # Execute the script
        & $scriptPath
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "[SUCCESS] Docker fix script completed successfully!" -ForegroundColor Green
        }
        else {
            Write-Host ""
            Write-Host "[WARNING] Docker fix script completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host ""
        Write-Host "[ERROR] Failed to execute Docker fix script: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "You can try running the script directly:" -ForegroundColor Yellow
        Write-Host "1. Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor White
        Write-Host "2. Navigate to the docker directory: cd docker" -ForegroundColor White
        Write-Host "3. Run the script: .\fix-docker-admin.ps1" -ForegroundColor White
    }
}
