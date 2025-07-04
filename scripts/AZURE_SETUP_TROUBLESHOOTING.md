# Azure Setup Troubleshooting Guide

## Issue: Line Ending Errors in Shell Scripts

### Problem
When running `./scripts/create-azure-resources.sh` on Windows, you may encounter errors like:
```
': not a valid identifiersources.sh: line 61: export: `US
```

### Root Cause
This error occurs because:
1. **Windows Line Endings (CRLF)**: Windows uses CRLF (`\r\n`) line endings while Unix/Linux uses LF (`\n`)
2. **Environment Variable Parsing**: The shell script fails to parse environment variables from `.env` file due to line ending issues
3. **Export Command Failure**: The `export` command receives malformed input due to carriage return characters

### Solution

#### Option 1: Use the PowerShell Wrapper (Recommended)
```powershell
# Navigate to project root
cd C:\Users\aklin\PycharmProjects\deckchatbot-monorepo

# Run the PowerShell wrapper script
.\scripts\run-azure-setup.ps1
```

This script will:
- ✅ Automatically convert line endings from CRLF to LF
- ✅ Detect WSL or Git Bash environment
- ✅ Execute the Azure setup script properly
- ✅ Provide clear feedback and next steps

#### Option 2: Manual Line Ending Conversion
If you prefer to fix manually:

1. **Convert .env file line endings**:
   ```powershell
   # Using PowerShell
   $content = Get-Content .env -Raw
   $content = $content -replace "`r`n", "`n"
   [System.IO.File]::WriteAllText(".env", $content, [System.Text.UTF8Encoding]::new($false))
   ```

2. **Convert shell script line endings**:
   ```powershell
   # Using PowerShell
   $content = Get-Content scripts/create-azure-resources.sh -Raw
   $content = $content -replace "`r`n", "`n"
   [System.IO.File]::WriteAllText("scripts/create-azure-resources.sh", $content, [System.Text.UTF8Encoding]::new($false))
   ```

3. **Run in WSL or Git Bash**:
   ```bash
   # In WSL or Git Bash
   chmod +x scripts/create-azure-resources.sh
   ./scripts/create-azure-resources.sh
   ```

## Prerequisites

### Required Software
1. **Azure CLI**: Install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
2. **WSL** or **Git Bash**: One of these Unix-like environments

### Azure Account Setup
1. **Azure Subscription**: Active Azure subscription
2. **Service Principal**: Created with appropriate permissions
3. **Environment Variables**: Properly configured in `.env` file

### Required Environment Variables
Ensure these are set in your `.env` file:
```bash
AZURE_CLIENT_ID=your-service-principal-client-id
AZURE_CLIENT_SECRET=your-service-principal-secret
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_SUBSCRIPTION_ID=your-azure-subscription-id
AZURE_RESOURCE_GROUP_NAME=deckchatbot-rg
AZURE_REGION=East US
```

## Common Issues and Solutions

### Issue 1: "Azure CLI not found"
**Solution**: Install Azure CLI
```powershell
# Using winget
winget install Microsoft.AzureCLI

# Or download from: https://aka.ms/installazurecliwindows
```

### Issue 2: "WSL not found" and "Git Bash not found"
**Solution**: Install one of these:

**Option A: Install WSL**
```powershell
# Run as Administrator
wsl --install
# Restart computer when prompted
```

**Option B: Install Git for Windows**
- Download from: https://git-scm.com/download/win
- Ensure "Git Bash" is selected during installation

### Issue 3: "Authentication failed"
**Solution**: Check Azure credentials
```bash
# Test Azure login
az login

# Verify subscription
az account show

# Check service principal (if using)
az ad sp show --id $AZURE_CLIENT_ID
```

### Issue 4: "Resource already exists"
**Solution**: The script handles existing resources, but if you encounter conflicts:
```bash
# Check existing resources
az group list --output table

# Delete resource group if needed (CAUTION: This deletes all resources)
az group delete --name deckchatbot-rg --yes --no-wait
```

### Issue 5: "Permission denied"
**Solution**: Ensure proper permissions
```bash
# Make script executable
chmod +x scripts/create-azure-resources.sh

# Check file permissions
ls -la scripts/create-azure-resources.sh
```

## Verification Steps

After successful execution, verify:

1. **Resource Group Created**:
   ```bash
   az group show --name deckchatbot-rg
   ```

2. **Storage Account Created**:
   ```bash
   az storage account list --resource-group deckchatbot-rg --output table
   ```

3. **Cosmos DB Created**:
   ```bash
   az cosmosdb list --resource-group deckchatbot-rg --output table
   ```

4. **Key Vault Created**:
   ```bash
   az keyvault list --resource-group deckchatbot-rg --output table
   ```

## Next Steps After Successful Setup

1. **Update .env file** with the output connection strings and keys
2. **Configure GitHub Secrets** for CI/CD pipeline
3. **Test local development** with new Azure resources
4. **Deploy application** using the configured resources

## Getting Help

If you continue to experience issues:

1. **Check Azure CLI version**: `az --version`
2. **Verify Azure login**: `az account show`
3. **Check script permissions**: `ls -la scripts/create-azure-resources.sh`
4. **Review Azure portal** for any created resources
5. **Check Azure activity log** for detailed error messages

## Prevention Tips

1. **Use consistent line endings**: Configure your editor to use LF line endings for shell scripts
2. **Use the PowerShell wrapper**: Always use `run-azure-setup.ps1` on Windows
3. **Version control**: Ensure `.gitattributes` is configured properly for line endings
4. **Regular testing**: Test scripts in both Windows and Unix environments

The PowerShell wrapper script (`run-azure-setup.ps1`) is designed to handle most of these issues automatically, making it the recommended approach for Windows users.
