# Azure VM Setup Guide for DeckChatBot

This guide explains how to set up an Azure Virtual Machine for running the DeckChatBot application using the provided automation script.

## Prerequisites

Before you begin, make sure you have:

1. **Azure Account**: An active Azure subscription
2. **Azure CLI**: Installed on your local machine
   - [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
3. **PowerShell**: Windows PowerShell or PowerShell Core
4. **SSH Key** (Optional): An existing SSH key pair or the script can create one for you

## Quick Start

1. Open PowerShell as Administrator
2. Navigate to the repository root directory
3. Run the setup script:

```powershell
.\scripts\create-azure-vm.ps1
```

The script will:
- Check if Azure CLI is installed
- Verify you're logged in to Azure (or prompt you to log in)
- Check for an existing SSH key or help you create one
- Create a resource group if needed
- Create an Azure VM with the recommended configuration
- Open the necessary ports (SSH, HTTP, HTTPS)
- Display the VM's public IP and next steps

## Customizing the VM Configuration

You can customize the VM configuration by passing parameters to the script:

```powershell
.\scripts\create-azure-vm.ps1 -VMName "my-custom-vm" -ResourceGroupName "my-custom-rg" -Location "westus" -VMSize "Standard_B4ms" -AdminUsername "myadmin"
```

### Available Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| VMName | deckchatbot-vm | Name of the virtual machine |
| ResourceGroupName | deckchatbot-rg | Name of the resource group |
| Location | eastus | Azure region (e.g., eastus, westus, etc.) |
| VMSize | Standard_B2s | VM size (2 vCPUs, 4GB RAM - $31/month) |
| AdminUsername | azureuser | Admin username for the VM |
| SSHKeyPath | $HOME\.ssh\id_rsa.pub | Path to your SSH public key |

## After VM Creation

Once your VM is created, follow these steps:

1. **Connect to your VM** using SSH:
   ```
   ssh azureuser@YOUR_VM_PUBLIC_IP
   ```

2. **Run the automated deployment script**:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/aklin/deckchatbot-monorepo/main/scripts/deploy-azure.sh | bash
   ```

3. **Optional: Configure a domain name**:
   - Point your domain's A record to your VM's public IP
   - After connecting to your VM, run:
     ```bash
     sudo ./scripts/setup-domain.sh your-domain.com
     ```

## Troubleshooting

### Azure CLI Not Installed

If Azure CLI is not installed, the script will provide a link to the installation instructions. Install Azure CLI and run the script again.

### Not Logged in to Azure

If you're not logged in to Azure, the script will attempt to log you in. If automatic login fails, you'll need to run `az login` manually.

### SSH Key Issues

If you don't have an SSH key, the script will offer to create one for you. If you choose not to create a new key, you'll need to provide the path to an existing SSH public key.

### VM Creation Failures

If VM creation fails, check:
- Your Azure subscription has enough quota for the selected VM size
- The region you selected is available for your subscription
- Your Azure account has permissions to create resources

## Cost Considerations

The default VM size (Standard_B2s) costs approximately $31/month. You can choose a different size based on your needs and budget.

## Security Considerations

- The script creates a VM with ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) open
- SSH key authentication is used for better security
- Consider setting up a firewall and restricting access to your VM

## Additional Resources

- [Azure VM Documentation](https://docs.microsoft.com/en-us/azure/virtual-machines/)
- [Azure CLI Documentation](https://docs.microsoft.com/en-us/cli/azure/)
- [DeckChatBot README](../README.md)
