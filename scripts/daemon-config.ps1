# Docker Daemon Configuration Script for DeckChatBot
# This script creates an improved Docker daemon configuration file

# Define the path to the Docker daemon configuration file
$daemonConfigPath = "C:\ProgramData\docker\config\daemon.json"

# Create the directory if it doesn't exist
$configDir = Split-Path -Parent $daemonConfigPath
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    Write-Host "Created directory: $configDir" -ForegroundColor Green
}

# Define the improved Docker daemon configuration
$daemonConfig = @{
    # Builder cache settings
    "builder" = @{
        "gc" = @{
            "defaultKeepStorage" = "20GB"
            "enabled" = $true
        }
    }
    
    # Container settings
    "default-address-pools" = @(
        @{
            "base" = "192.168.65.0/24"
            "size" = 24
        }
    )
    
    # Runtime settings
    "experimental" = $false
    "features" = @{
        "buildkit" = $true
    }
    
    # Resource limits
    "default-shm-size" = "2G"
    "default-ulimits" = @{
        "nofile" = @{
            "Name" = "nofile"
            "Hard" = 64000
            "Soft" = 64000
        }
    }
    
    # Logging configuration
    "log-driver" = "json-file"
    "log-opts" = @{
        "max-size" = "50m"
        "max-file" = "3"
    }
    
    # Storage settings
    "storage-driver" = "windowsfilter"
    "storage-opts" = @(
        "size=50GB"
    )
    
    # Security settings
    "no-new-privileges" = $true
    "selinux-enabled" = $false
    "userns-remap" = ""
    
    # Performance settings
    "registry-mirrors" = @(
        "https://registry-1.docker.io"
    )
    "max-concurrent-downloads" = 5
    "max-concurrent-uploads" = 5
}

# Convert the configuration to JSON
$daemonConfigJson = $daemonConfig | ConvertTo-Json -Depth 10

# Write the configuration to the daemon.json file
$daemonConfigJson | Out-File -FilePath $daemonConfigPath -Encoding utf8 -Force

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "      Docker Daemon Configuration Created           " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration file created at: $daemonConfigPath" -ForegroundColor Green
Write-Host ""
Write-Host "This improved configuration includes:" -ForegroundColor Yellow
Write-Host "  • Optimized builder cache settings (20GB)" -ForegroundColor White
Write-Host "  • Custom address pool matching your docker-compose network" -ForegroundColor White
Write-Host "  • BuildKit enabled for faster builds" -ForegroundColor White
Write-Host "  • Increased shared memory size (2GB)" -ForegroundColor White
Write-Host "  • Higher file descriptor limits" -ForegroundColor White
Write-Host "  • Log rotation (50MB max size, 3 files)" -ForegroundColor White
Write-Host "  • Storage driver configuration with 50GB limit" -ForegroundColor White
Write-Host "  • Security enhancements" -ForegroundColor White
Write-Host "  • Performance optimizations for concurrent operations" -ForegroundColor White
Write-Host ""
Write-Host "To apply these changes:" -ForegroundColor Yellow
Write-Host "1. Restart the Docker service:" -ForegroundColor White
Write-Host "   Restart-Service docker" -ForegroundColor White
Write-Host ""
Write-Host "2. Verify the configuration:" -ForegroundColor White
Write-Host "   docker info" -ForegroundColor White
Write-Host ""
Write-Host "Note: Some settings may need adjustment based on your specific hardware and requirements." -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
