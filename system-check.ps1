# System environment check script
$ErrorActionPreference = 'SilentlyContinue'

$logFile = Join-Path -Path (Get-Location) -ChildPath 'system-check.log'
if (Test-Path $logFile) { Remove-Item $logFile }

function Write-Log($Message, $Color='White') {
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $logFile -Value $Message
}

# OS details
$os = Get-CimInstance Win32_OperatingSystem
$osVersion = $os.Caption + ' ' + $os.Version
$arch = $os.OSArchitecture
Write-Log "OS Version: $osVersion"
Write-Log "Architecture: $arch"
Write-Log ''

$summary = @()

function Check-Tool($name, $cmd, $args, $regex) {
    $exists = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($exists) {
        $output = & $cmd $args 2>&1
        if ($regex -and ($output -match $regex)) { $version = $Matches[0] } else { $version = $output }
        Write-Log "$name version: $version"
        $summary += @{ Name = $name; Status = 'OK' }
    } else {
        Write-Log "$name not found" 'Red'
        $summary += @{ Name = $name; Status = 'Missing' }
    }
}

Check-Tool 'Azure CLI' 'az' '--version' '(\d+\.?)+'
Check-Tool 'Docker' 'docker' '--version' '(\d+\.?)+'
Check-Tool 'Python' 'python' '--version' '(\d+\.?)+'
Check-Tool 'Node.js' 'node' '--version' '(\d+\.?)+'
Check-Tool 'npm' 'npm' '--version' '(\d+\.?)+'
Check-Tool 'Git' 'git' '--version' '(\d+\.?)+'
Check-Tool '.NET SDK' 'dotnet' '--version' '(\d+\.?)+'

# docker-compose
if (Get-Command 'docker-compose' -ErrorAction SilentlyContinue) {
    $ver = docker-compose --version
    Write-Log "docker-compose version: $ver"
    $summary += @{ Name = 'docker-compose'; Status = 'OK' }
} else {
    Write-Log 'docker-compose not found' 'Red'
    $summary += @{ Name = 'docker-compose'; Status = 'Missing' }
}

# vswhere
if (Get-Command 'vswhere' -ErrorAction SilentlyContinue) {
    Write-Log 'vswhere found'
    $summary += @{ Name = 'vswhere'; Status = 'OK' }
} else {
    Write-Log 'vswhere not found' 'Red'
    $summary += @{ Name = 'vswhere'; Status = 'Missing' }
}

Write-Log ''

# .NET SDKs and runtimes
$sdks = & dotnet --list-sdks 2>$null
if ($sdks) { Write-Log "Installed .NET SDKs:\n$sdks" } else { Write-Log 'No .NET SDKs detected' }
$runtimes = & dotnet --list-runtimes 2>$null
if ($runtimes) { Write-Log "Installed .NET runtimes:\n$runtimes" }

Write-Log ''

# Windows SDKs
$winSDKs = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Microsoft SDKs\Windows\v*' -ErrorAction SilentlyContinue
if ($winSDKs) {
    Write-Log 'Windows SDKs:'
    $winSDKs | ForEach-Object { Write-Log " - $($_.InstallationFolder) ($($_.ProductName))" }
} else {
    Write-Log 'Windows SDKs not found'
}

Write-Log ''

# Azure directories in Program Files
$azureDirs = Get-ChildItem 'C:\Program Files' -Filter '*azure*' -Directory -ErrorAction SilentlyContinue
if ($azureDirs) {
    Write-Log 'Azure related directories in Program Files:'
    $azureDirs | ForEach-Object { Write-Log " - $($_.FullName)" }
}

Write-Log ''

# az login
if (Get-Command 'az' -ErrorAction SilentlyContinue) {
    $sub = az account show --query name -o tsv 2>$null
    if ($LASTEXITCODE -eq 0 -and $sub) {
        Write-Log "Active Azure subscription: $sub"
    } else {
        Write-Log 'Azure CLI not logged in'
    }
}

# winget detection
if (Get-Command 'winget' -ErrorAction SilentlyContinue) {
    Write-Log 'winget detected.'
} else {
    Write-Log 'winget not found. Use winget to install missing tools.'
}

Write-Log ''
Write-Log '--- SUMMARY ---'
foreach ($e in $summary) {
    $status = if ($e.Status -eq 'OK') { '✅ OK' } else { '❌ Missing' }
    $color = if ($e.Status -eq 'OK') { 'Green' } else { 'Red' }
    $msg = "{0,-15} {1}" -f $e.Name, $status
    Write-Log $msg $color
}

$missing = ($summary | Where-Object { $_.Status -eq 'Missing' }).Count
if ($missing -eq 0) {
    Write-Log 'All checks passed.' 'Green'
} else {
    Write-Log "$missing tool(s) missing." 'Red'
}
