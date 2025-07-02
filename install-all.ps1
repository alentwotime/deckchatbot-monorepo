# PowerShell script to install all dependencies
Write-Host "Installing root dependencies..."
npm install
Write-Host "Installing backend dependencies..."
Push-Location -Path "apps\backend"
npm install
Pop-Location
Write-Host "Installing frontend dependencies..."
Push-Location -Path "apps\frontend"
npm install
Pop-Location
Write-Host "All dependencies installed successfully!"
