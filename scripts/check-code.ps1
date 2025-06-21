param(
    [switch]$fix
)

$ErrorActionPreference = 'Continue'

$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$logsDir = Join-Path $repoRoot 'logs'
if (!(Test-Path $logsDir)) { New-Item -Path $logsDir -ItemType Directory | Out-Null }

$pyLog = Join-Path $logsDir "python-lint-$timestamp.log"
$jsLog = Join-Path $logsDir "js-lint-$timestamp.log"

Write-Host "Running Python lint and format..." -ForegroundColor Cyan

# Python linting and formatting
$pySuccess = $true

docker-compose run --rm backend flake8 2>&1 | Tee-Object -FilePath $pyLog
if ($LASTEXITCODE -ne 0) { $pySuccess = $false }

docker-compose run --rm backend black . 2>&1 | Tee-Object -FilePath $pyLog -Append
if ($LASTEXITCODE -ne 0) { $pySuccess = $false }

docker-compose run --rm backend isort . 2>&1 | Tee-Object -FilePath $pyLog -Append
if ($LASTEXITCODE -ne 0) { $pySuccess = $false }

if ($pySuccess) {
    Write-Host "Python ✅ Passed" -ForegroundColor Green
} else {
    Write-Host "Python ❌ Errors Found" -ForegroundColor Red
}

# JavaScript/TypeScript linting
Write-Host "Running JavaScript/TypeScript lint..." -ForegroundColor Cyan
$jsSuccess = $true

$eslintCmd = 'eslint .'
if ($fix) { $eslintCmd = 'eslint . --fix' }

# run inside frontend container
# Use bash -c to pass full command

docker-compose run --rm frontend sh -c $eslintCmd 2>&1 | Tee-Object -FilePath $jsLog
if ($LASTEXITCODE -ne 0) { $jsSuccess = $false }

if ($jsSuccess) {
    Write-Host "JavaScript ✅ Passed" -ForegroundColor Green
} else {
    Write-Host "JavaScript ❌ Errors Found" -ForegroundColor Red
}

if ($pySuccess -and $jsSuccess) {
    exit 0
} else {
    exit 1
}

