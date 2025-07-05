# Docker Subnet Configuration Test Script
Write-Host "[INFO] Docker Subnet Configuration Test Script" -ForegroundColor Green
Write-Host "This script tests if the subnet 192.168.65.0/24 is correctly configured and if there are any conflicts."

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        # Try different API versions to handle compatibility issues
        $apiVersions = @("1.41", "1.40", "1.39", "1.38", "1.35")

        foreach ($version in $apiVersions) {
            $env:DOCKER_API_VERSION = $version
            $result = docker version --format "{{.Client.Version}}" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[INFO] Docker is running with API version $version" -ForegroundColor Green
                return $true
            }
        }

        # If all API versions fail, check if it's a service issue
        $dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
        if ($dockerService -and $dockerService.Status -ne "Running") {
            Write-Host "[WARNING] Docker Desktop Service is not running. Run fix-docker-admin.ps1 as Administrator to fix this." -ForegroundColor Yellow
        }

        return $false
    }
    catch {
        return $false
    }
}

# Function to check for subnet conflicts
function Test-SubnetConflicts {
    param (
        [string]$Subnet = "192.168.65.0/24"
    )
    
    Write-Host "[INFO] Checking for subnet conflicts with $Subnet..." -ForegroundColor Yellow
    
    # Parse the subnet to get the network prefix
    $subnetParts = $Subnet -split "/"
    $networkPrefix = $subnetParts[0]
    $prefixLength = [int]$subnetParts[1]
    
    # Get the first three octets of the network prefix
    $networkOctets = $networkPrefix -split "\."
    $networkBase = "$($networkOctets[0]).$($networkOctets[1]).$($networkOctets[2])"
    
    # Check for conflicts with local network adapters
    $adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "$networkBase.*" }
    
    if ($adapters) {
        Write-Host "[WARNING] Potential subnet conflict detected!" -ForegroundColor Red
        Write-Host "The following network adapters use IP addresses in the $networkBase.* range:" -ForegroundColor Red
        
        foreach ($adapter in $adapters) {
            Write-Host "  - $($adapter.InterfaceAlias): $($adapter.IPAddress)/$($adapter.PrefixLength)" -ForegroundColor Red
        }
        
        return $false
    }
    else {
        Write-Host "[OK] No subnet conflicts detected with local network adapters." -ForegroundColor Green
    }
    
    # Check for conflicts with VPN connections
    $vpnAdapters = Get-NetAdapter | Where-Object { $_.InterfaceDescription -like "*VPN*" }
    
    if ($vpnAdapters) {
        Write-Host "[INFO] VPN adapters detected. Checking for potential conflicts..." -ForegroundColor Yellow
        
        foreach ($vpn in $vpnAdapters) {
            $vpnIPs = Get-NetIPAddress -InterfaceIndex $vpn.ifIndex -AddressFamily IPv4
            
            foreach ($ip in $vpnIPs) {
                $vpnOctets = $ip.IPAddress -split "\."
                $vpnBase = "$($vpnOctets[0]).$($vpnOctets[1]).$($vpnOctets[2])"
                
                if ($vpnBase -eq $networkBase) {
                    Write-Host "[WARNING] Potential conflict with VPN adapter $($vpn.Name): $($ip.IPAddress)/$($ip.PrefixLength)" -ForegroundColor Red
                    return $false
                }
            }
        }
        
        Write-Host "[OK] No conflicts detected with VPN adapters." -ForegroundColor Green
    }
    
    return $true
}

# Function to test Docker network creation
function Test-DockerNetworkCreation {
    param (
        [string]$ComposeFile = "docker-compose.yml"
    )
    
    Write-Host "[INFO] Testing Docker network creation with $ComposeFile..." -ForegroundColor Yellow
    
    # Measure the time it takes to create the network
    $startTime = Get-Date
    
    try {
        # Create the network without starting containers
        docker compose -f $ComposeFile up --no-start 2>&1 | Out-Null
        $exitCode = $LASTEXITCODE
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($exitCode -eq 0) {
            Write-Host "[SUCCESS] Network creation completed in $([math]::Round($duration, 2)) seconds." -ForegroundColor Green
            
            # Check if the network exists
            $network = docker network ls --filter "name=docker_decknet" --format "{{.Name}}"
            
            if ($network) {
                Write-Host "[OK] Network 'docker_decknet' exists." -ForegroundColor Green
                
                # Get network details
                $networkDetails = docker network inspect $network --format "{{.IPAM.Config}}"
                Write-Host "Network configuration: $networkDetails" -ForegroundColor Cyan
                
                # Clean up
                docker compose -f $ComposeFile down 2>&1 | Out-Null
                
                return $true
            }
            else {
                Write-Host "[ERROR] Network 'docker_decknet' was not created." -ForegroundColor Red
                return $false
            }
        }
        else {
            Write-Host "[ERROR] Network creation failed after $([math]::Round($duration, 2)) seconds." -ForegroundColor Red
            return $false
        }
    }
    catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-Host "[ERROR] Exception during network creation after $([math]::Round($duration, 2)) seconds: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "Starting Docker subnet configuration tests..." -ForegroundColor Cyan

# Check if Docker is running
if (-not (Test-DockerRunning)) {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Docker is running" -ForegroundColor Green

# Check for subnet conflicts
$subnetCheck = Test-SubnetConflicts -Subnet "192.168.65.0/24"

# Test network creation with different configurations
Write-Host "`n[TEST] Testing network creation with original configuration (custom subnet)..." -ForegroundColor Cyan
$originalTest = Test-DockerNetworkCreation -ComposeFile "docker-compose.yml"

Write-Host "`n[TEST] Testing network creation with improved configuration (no custom subnet)..." -ForegroundColor Cyan
$improvedTest = Test-DockerNetworkCreation -ComposeFile "docker-compose-improved.yml"

# Summary
Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "Docker Subnet Configuration Test Results" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

Write-Host "`nSubnet Conflict Check: " -NoNewline
if ($subnetCheck) {
    Write-Host "PASSED" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red
}

Write-Host "Original Configuration Test: " -NoNewline
if ($originalTest) {
    Write-Host "PASSED" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red
}

Write-Host "Improved Configuration Test: " -NoNewline
if ($improvedTest) {
    Write-Host "PASSED" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red
}

Write-Host "`nRecommendation:" -ForegroundColor Cyan
if (-not $subnetCheck -or -not $originalTest) {
    Write-Host "Use the improved configuration without custom subnet:" -ForegroundColor Yellow
    Write-Host "docker compose -f docker-compose-improved.yml up --build" -ForegroundColor White
} elseif ($originalTest -and $improvedTest) {
    Write-Host "Both configurations work well. You can use either:" -ForegroundColor Green
    Write-Host "1. Original (with custom subnet): docker compose up --build" -ForegroundColor White
    Write-Host "2. Improved (without custom subnet): docker compose -f docker-compose-improved.yml up --build" -ForegroundColor White
} else {
    Write-Host "Use the original configuration with custom subnet:" -ForegroundColor Yellow
    Write-Host "docker compose up --build" -ForegroundColor White
}

Write-Host "`nFor more information, see the subnet configuration guide:" -ForegroundColor Cyan
Write-Host "notepad SUBNET_CONFIGURATION.md" -ForegroundColor White
