# PowerShell script to install all dependencies

# Function to check if a command exists
function Test-CommandExists {
    param ($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Function to run npm install with error handling
function Install-NpmDependencies {
    param ($directory)

    if (!(Test-Path $directory)) {
        Write-Host "Error: Directory '$directory' does not exist." -ForegroundColor Red
        return $false
    }

    if ($directory -ne ".") {
        Push-Location -Path $directory
    }

    Write-Host "Installing dependencies in $directory..." -ForegroundColor Cyan
    npm install
    $npmSuccess = $?

    if (!$npmSuccess) {
        Write-Host "Error: npm install failed in $directory." -ForegroundColor Red
    }
    else {
        Write-Host "Successfully installed dependencies in $directory." -ForegroundColor Green
    }

    if ($directory -ne ".") {
        Pop-Location
    }

    return $npmSuccess
}

# Check if npm is installed
if (!(Test-CommandExists "npm")) {
    Write-Host "Error: npm is not installed. Please install Node.js and npm first." -ForegroundColor Red
    exit 1
}

# Check if python is installed for AI service dependencies
$pythonInstalled = Test-CommandExists "python" -or Test-CommandExists "python3"
if (!$pythonInstalled) {
    Write-Host "Warning: Python is not installed. AI service dependencies will not be installed." -ForegroundColor Yellow
}

Write-Host "Starting installation of all dependencies..." -ForegroundColor Cyan

# Install root dependencies
$rootSuccess = Install-NpmDependencies "."
if (!$rootSuccess) {
    Write-Host "Warning: Failed to install root dependencies. Continuing with other installations..." -ForegroundColor Yellow
}

# Install backend dependencies
$backendSuccess = Install-NpmDependencies "apps\backend"
if (!$backendSuccess) {
    Write-Host "Warning: Failed to install backend dependencies." -ForegroundColor Yellow
}

# Install frontend dependencies
$frontendSuccess = Install-NpmDependencies "apps\frontend"
if (!$frontendSuccess) {
    Write-Host "Warning: Failed to install frontend dependencies." -ForegroundColor Yellow
}

# Install Python dependencies if Python is installed
$pythonSuccess = $false
if ($pythonInstalled) {
    $aiServiceRequirements = "apps\ai-service\requirements.txt"
    if (Test-Path $aiServiceRequirements) {
        Write-Host "Installing AI service Python dependencies..." -ForegroundColor Cyan
        python -m pip install --upgrade pip
        python -m pip install -r $aiServiceRequirements
        $pythonSuccess = $?

        if ($pythonSuccess) {
            Write-Host "Successfully installed AI service Python dependencies." -ForegroundColor Green
        }
        else {
            Write-Host "Warning: Failed to install AI service Python dependencies." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Warning: AI service requirements file not found at $aiServiceRequirements" -ForegroundColor Yellow
    }
}

Write-Host "`nInstallation Summary:" -ForegroundColor Cyan
Write-Host "Root dependencies: $(if ($rootSuccess) { 'Installed' } else { 'Failed' })" -ForegroundColor $(if ($rootSuccess) { 'Green' } else { 'Red' })
Write-Host "Backend dependencies: $(if ($backendSuccess) { 'Installed' } else { 'Failed' })" -ForegroundColor $(if ($backendSuccess) { 'Green' } else { 'Red' })
Write-Host "Frontend dependencies: $(if ($frontendSuccess) { 'Installed' } else { 'Failed' })" -ForegroundColor $(if ($frontendSuccess) { 'Green' } else { 'Red' })
if ($pythonInstalled) {
    Write-Host "AI service dependencies: $(if ($pythonSuccess) { 'Installed' } else { 'Failed' })" -ForegroundColor $(if ($pythonSuccess) { 'Green' } else { 'Red' })
}
else {
    Write-Host "AI service dependencies: Not installed (Python not found)" -ForegroundColor Yellow
}

Write-Host "`nAll dependency installations completed!" -ForegroundColor Cyan
Write-Host "If any installations failed, please check the error messages above and try again." -ForegroundColor Cyan
