#!/bin/bash
# Script to disable the daily login message in WSL Ubuntu

# Display welcome message
echo "=== WSL Login Message Disabler ==="
echo "This script will disable the daily login message in your WSL Ubuntu environment."
echo ""

# Check if running in WSL
if ! grep -q "microsoft" /proc/version &>/dev/null; then
    echo "Error: This script must be run in a WSL environment."
    echo "Please run this script from your Ubuntu WSL terminal."
    exit 1
fi

# Create .hushlogin file if it doesn't exist
if [ -f ~/.hushlogin ]; then
    echo "The .hushlogin file already exists in your home directory."
    echo "The daily login message should already be disabled."
else
    touch ~/.hushlogin
    echo "Created .hushlogin file in your home directory."
    echo "The daily login message has been disabled."
fi

# Verify the file was created
if [ -f ~/.hushlogin ]; then
    echo ""
    echo "Success! The .hushlogin file has been verified."
    echo "The daily login message will no longer appear when you open your WSL terminal."
    echo ""
    echo "To re-enable the daily login message, simply delete the .hushlogin file:"
    echo "  rm ~/.hushlogin"
else
    echo ""
    echo "Error: Failed to create the .hushlogin file."
    echo "Please try creating it manually with the command: touch ~/.hushlogin"
fi

echo ""
echo "=== Script completed ==="
