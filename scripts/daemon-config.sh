#!/bin/bash
# Docker Daemon Configuration Script for DeckChatBot
# This script creates an improved Docker daemon configuration file for Linux

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Define the path to the Docker daemon configuration file
DAEMON_CONFIG_PATH="/etc/docker/daemon.json"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}This script must be run as root (use sudo)${NC}"
  exit 1
fi

# Create the directory if it doesn't exist
CONFIG_DIR=$(dirname "$DAEMON_CONFIG_PATH")
if [ ! -d "$CONFIG_DIR" ]; then
    mkdir -p "$CONFIG_DIR"
    echo -e "${GREEN}Created directory: $CONFIG_DIR${NC}"
fi

# Define the improved Docker daemon configuration
cat > "$DAEMON_CONFIG_PATH" << 'EOF'
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "default-address-pools": [
    {
      "base": "192.168.65.0/24",
      "size": 24
    }
  ],
  "experimental": false,
  "features": {
    "buildkit": true
  },
  "default-shm-size": "2G",
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.size=50G"
  ],
  "no-new-privileges": true,
  "selinux-enabled": false,
  "userns-remap": "",
  "registry-mirrors": [
    "https://registry-1.docker.io"
  ],
  "max-concurrent-downloads": 5,
  "max-concurrent-uploads": 5
}
EOF

# Set proper permissions
chmod 644 "$DAEMON_CONFIG_PATH"

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}      Docker Daemon Configuration Created           ${NC}"
echo -e "${CYAN}====================================================${NC}"
echo ""
echo -e "${GREEN}Configuration file created at: $DAEMON_CONFIG_PATH${NC}"
echo ""
echo -e "${YELLOW}This improved configuration includes:${NC}"
echo -e "${WHITE}  • Optimized builder cache settings (20GB)${NC}"
echo -e "${WHITE}  • Custom address pool matching your docker-compose network${NC}"
echo -e "${WHITE}  • BuildKit enabled for faster builds${NC}"
echo -e "${WHITE}  • Increased shared memory size (2GB)${NC}"
echo -e "${WHITE}  • Higher file descriptor limits${NC}"
echo -e "${WHITE}  • Log rotation (50MB max size, 3 files)${NC}"
echo -e "${WHITE}  • Storage driver configuration with 50GB limit${NC}"
echo -e "${WHITE}  • Security enhancements${NC}"
echo -e "${WHITE}  • Performance optimizations for concurrent operations${NC}"
echo ""
echo -e "${YELLOW}To apply these changes:${NC}"
echo -e "${WHITE}1. Restart the Docker service:${NC}"
echo -e "${WHITE}   sudo systemctl restart docker${NC}"
echo ""
echo -e "${WHITE}2. Verify the configuration:${NC}"
echo -e "${WHITE}   docker info${NC}"
echo ""
echo -e "${YELLOW}Note: Some settings may need adjustment based on your specific hardware and requirements.${NC}"
echo -e "${CYAN}====================================================${NC}"
