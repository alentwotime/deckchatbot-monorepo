# Azure Resource Setup Script for Windows
# This script handles line ending conversion and runs the Azure setup in WSL/Git Bash

Write-Host "[INFO] Azure Resource Setup for Windows" -ForegroundColor Green
Write-Host "This script will convert line endings and run the Azure resource creation script" -ForegroundColor Yellow

# Function to check if WSL is available
function Test-WSLAvailable {
    try {
        wsl --list --quiet 2>$null | Out-Null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

# Function to check if Git Bash is available
function Test-GitBashAvailable {
    $gitBashPaths = @(
        "${env:ProgramFiles}\Git\bin\bash.exe",
        "${env:ProgramFiles(x86)}\Git\bin\bash.exe",
        "${env:LOCALAPPDATA}\Programs\Git\bin\bash.exe"
    )
    
    foreach ($path in $gitBashPaths) {
        if (Test-Path $path) {
            return $path
        }
    }
    return $null
}

# Function to convert line endings
function Convert-LineEndings {
    param($FilePath)
    
    Write-Host "[INFO] Converting line endings for: $FilePath" -ForegroundColor Yellow
    
    try {
        $content = Get-Content $FilePath -Raw
        $content = $content -replace "`r`n", "`n"  # Convert CRLF to LF
        $content = $content -replace "`r", "`n"    # Convert CR to LF
        [System.IO.File]::WriteAllText($FilePath, $content, [System.Text.UTF8Encoding]::new($false))
        Write-Host "[SUCCESS] Line endings converted successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "[ERROR] Failed to convert line endings: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Azure Resource Setup - Windows Compatibility" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host ""
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found in current directory" -ForegroundColor Red
    Write-Host "Please ensure you're in the project root directory and .env file exists" -ForegroundColor Yellow
    exit 1
}

# Convert line endings for critical files
Write-Host ""
Write-Host "Step 2: Converting line endings..." -ForegroundColor Cyan

$filesToConvert = @(
    "scripts/create-azure-resources.sh",
    ".env"
)

$conversionSuccess = $true
foreach ($file in $filesToConvert) {
    if (Test-Path $file) {
        if (-not (Convert-LineEndings $file)) {
            $conversionSuccess = $false
        }
    }
    else {
        Write-Host "[WARNING] File not found: $file" -ForegroundColor Yellow
    }
}

if (-not $conversionSuccess) {
    Write-Host "[ERROR] Line ending conversion failed" -ForegroundColor Red
    exit 1
}

# Determine execution environment
Write-Host ""
Write-Host "Step 3: Determining execution environment..." -ForegroundColor Cyan

$useWSL = $false
$gitBashPath = $null

if (Test-WSLAvailable) {
    Write-Host "[INFO] WSL detected and available" -ForegroundColor Green
    $useWSL = $true
}
else {
    $gitBashPath = Test-GitBashAvailable
    if ($gitBashPath) {
        Write-Host "[INFO] Git Bash detected at: $gitBashPath" -ForegroundColor Green
    }
    else {
        Write-Host "[ERROR] Neither WSL nor Git Bash found" -ForegroundColor Red
        Write-Host "Please install one of the following:" -ForegroundColor Yellow
        Write-Host "1. Windows Subsystem for Linux (WSL)" -ForegroundColor White
        Write-Host "2. Git for Windows (includes Git Bash)" -ForegroundColor White
        exit 1
    }
}

# Execute the Azure setup script
Write-Host ""
Write-Host "Step 4: Executing Azure resource creation script..." -ForegroundColor Cyan

try {
    if ($useWSL) {
        Write-Host "[INFO] Running script in WSL..." -ForegroundColor Yellow
        wsl bash -c "cd /mnt/c/Users/aklin/PycharmProjects/deckchatbot-monorepo && chmod +x scripts/create-azure-resources.sh && ./scripts/create-azure-resources.sh"
    }
    else {
        Write-Host "[INFO] Running script in Git Bash..." -ForegroundColor Yellow
        $currentDir = (Get-Location).Path
        $bashCurrentDir = $currentDir -replace "C:", "/c" -replace "\\", "/"
        & $gitBashPath -c "cd '$bashCurrentDir' && chmod +x scripts/create-azure-resources.sh && ./scripts/create-azure-resources.sh"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host "Azure Resource Creation Completed Successfully!" -ForegroundColor Green
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Update your .env file with the output values" -ForegroundColor White
        Write-Host "2. Configure GitHub secrets for CI/CD" -ForegroundColor White
        Write-Host "3. Test your deployment" -ForegroundColor White
    }
    else {
        Write-Host ""
        Write-Host "[ERROR] Azure resource creation failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
}
catch {
    Write-Host "[ERROR] Failed to execute script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Azure Setup Complete" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
