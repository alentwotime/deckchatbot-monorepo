# PowerShell Deployment Guide for DeckChatBot

This guide explains how to deploy DeckChatBot using PowerShell on Windows.

## Background

The original deployment commands used Linux-style `curl` with options like `-fsSL` which don't work in Windows PowerShell. This guide provides Windows-compatible alternatives.

## Prerequisites

- Windows PowerShell or PowerShell Core
- Git for Windows (includes bash)
- Azure CLI installed and configured
- SSH key generated (the script can help with this)

## Deployment Steps

### Step 1: Clone the Repository

```powershell
git clone https://github.com/AlenTwoTime/deckchatbot-monorepo.git
cd deckchatbot-monorepo
```

### Step 2: Run the Azure VM Setup Script

```powershell
.\scripts\create-azure-vm.ps1
```

This script will:
- Check if Azure CLI is installed
- Verify you're logged in to Azure
- Create a resource group if needed
- Create an Azure VM with the recommended configuration
- Open the necessary ports (SSH, HTTP, HTTPS)
- Display the VM's public IP and next steps

### Step 3: Connect to Your Azure VM

```powershell
ssh azureuser@YOUR_VM_PUBLIC_IP
```

Replace `YOUR_VM_PUBLIC_IP` with the IP address displayed by the setup script.

### Step 4: Download and Run the Deployment Script

Once connected to your VM via SSH, run:

```bash
# Download the deployment script
curl -o deploy-azure.sh https://raw.githubusercontent.com/AlenTwoTime/deckchatbot-monorepo/main/scripts/deploy-azure.sh

# Make it executable
chmod +x deploy-azure.sh

# Run the script
bash deploy-azure.sh
```

## Testing the Download Command

If you want to test the download command without executing the script, you can run:

```powershell
.\scripts\test-download.ps1
```

This script will:
- Download the deployment script
- Verify it was downloaded successfully
- Show the first few lines of the file

## Troubleshooting

### Error: "A parameter cannot be found that matches parameter name 'fsSL'"

This error occurs when using Linux-style curl commands in PowerShell. Use the Invoke-WebRequest command instead:

```powershell
# Instead of:
# curl -fsSL https://raw.githubusercontent.com/AlenTwoTime/deckchatbot-monorepo/main/scripts/deploy-azure.sh | bash

# Use:
Invoke-WebRequest -Uri https://raw.githubusercontent.com/AlenTwoTime/deckchatbot-monorepo/main/scripts/deploy-azure.sh -OutFile deploy-azure.sh
bash deploy-azure.sh
```

### Error: "bash is not recognized as the name of a cmdlet"

This error occurs if Git for Windows is not installed or not in your PATH. Install Git for Windows, which includes bash.

### Error: "The remote name could not be resolved"

This error occurs if there's a network issue or if the GitHub repository URL is incorrect. Verify your internet connection and check that the repository URL is correct.

## Additional Resources

- [Azure VM Setup Guide](azure-vm-setup.md)
- [Deployment Status](deployment-status.md)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [Git for Windows](https://gitforwindows.org/)
