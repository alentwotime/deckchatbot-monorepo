# Create Azure VM for DeckChatBot
# This script automates the creation of an Azure VM as described in the README.md

# Parameters
param (
    [Parameter(Mandatory=$false)]
    [string]$VMName = "deckchatbot-vm",

    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "deckchatbot-rg",

    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",

    [Parameter(Mandatory=$false)]
    [string]$VMSize = "Standard_B2s",

    [Parameter(Mandatory=$false)]
    [string]$AdminUsername = "azureuser",

    [Parameter(Mandatory=$false)]
    [string]$SSHKeyPath = "$HOME\.ssh\id_rsa.pub"
)

# Print banner
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "          DeckChatBot Azure VM Setup Tool           " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
try {
    $azVersion = az --version
    Write-Host "✅ Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Azure
try {
    $account = az account show | ConvertFrom-Json
    Write-Host "✅ Logged in to Azure as: $($account.user.name)" -ForegroundColor Green
    Write-Host "   Subscription: $($account.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Azure. Please login first." -ForegroundColor Red
    Write-Host "   Running 'az login'..." -ForegroundColor Yellow
    az login

    # Check again if login was successful
    try {
        $account = az account show | ConvertFrom-Json
        Write-Host "✅ Logged in to Azure as: $($account.user.name)" -ForegroundColor Green
        Write-Host "   Subscription: $($account.name)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to login to Azure. Please try again manually with 'az login'" -ForegroundColor Red
        exit 1
    }
}

# Check if SSH key exists, create if not
if (-not (Test-Path $SSHKeyPath)) {
    Write-Host "SSH key not found at $SSHKeyPath" -ForegroundColor Yellow
    $createKey = Read-Host "Do you want to create a new SSH key? (y/n)"

    if ($createKey -eq "y") {
        $sshKeyDir = Split-Path -Parent $SSHKeyPath
        if (-not (Test-Path $sshKeyDir)) {
            New-Item -ItemType Directory -Path $sshKeyDir | Out-Null
        }

        Write-Host "Generating new SSH key..." -ForegroundColor Yellow
        ssh-keygen -t rsa -b 4096 -f "$HOME\.ssh\id_rsa" -N ""

        if (Test-Path $SSHKeyPath) {
            Write-Host "✅ SSH key created successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create SSH key. Please create it manually or specify a different path." -ForegroundColor Red
            exit 1
        }
    } else {
        $SSHKeyPath = Read-Host "Please enter the path to your existing SSH public key"
        if (-not (Test-Path $SSHKeyPath)) {
            Write-Host "❌ SSH key not found at $SSHKeyPath" -ForegroundColor Red
            exit 1
        }
    }
}

# Read SSH public key
$sshPublicKey = Get-Content $SSHKeyPath

# Create resource group if it doesn't exist
Write-Host "Checking if resource group exists..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName | ConvertFrom-Json

if (-not $rgExists) {
    Write-Host "Creating resource group: $ResourceGroupName in $Location..." -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
    Write-Host "✅ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✅ Resource group already exists" -ForegroundColor Green
}

# Create VM
Write-Host "Creating Azure VM with the following configuration:" -ForegroundColor Yellow
Write-Host "  - Name: $VMName" -ForegroundColor Yellow
Write-Host "  - Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "  - Location: $Location" -ForegroundColor Yellow
Write-Host "  - Size: $VMSize (2 vCPUs, 4GB RAM - $31/month)" -ForegroundColor Yellow
Write-Host "  - Image: Ubuntu Server 22.04 LTS" -ForegroundColor Yellow
Write-Host "  - Username: $AdminUsername" -ForegroundColor Yellow
Write-Host "  - Authentication: SSH Key" -ForegroundColor Yellow
Write-Host "  - Open Ports: SSH (22), HTTP (80), HTTPS (443)" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Do you want to proceed with this configuration? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Operation cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host "Creating VM... (this may take a few minutes)" -ForegroundColor Yellow

# Create VM with SSH key authentication
az vm create `
    --resource-group $ResourceGroupName `
    --name $VMName `
    --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts:latest" `
    --size $VMSize `
    --admin-username $AdminUsername `
    --ssh-key-values $sshPublicKey `
    --public-ip-sku Standard `
    --nsg-rule SSH

# Open HTTP and HTTPS ports
Write-Host "Opening HTTP and HTTPS ports..." -ForegroundColor Yellow
az vm open-port --resource-group $ResourceGroupName --name $VMName --port 80 --priority 1001
az vm open-port --resource-group $ResourceGroupName --name $VMName --port 443 --priority 1002

# Get VM public IP
$vmInfo = az vm show -d -g $ResourceGroupName -n $VMName | ConvertFrom-Json
$publicIP = $vmInfo.publicIps

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "          Azure VM Created Successfully!            " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "VM Public IP: $publicIP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connect to your VM using SSH:" -ForegroundColor Yellow
Write-Host "  ssh $AdminUsername@$publicIP" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Connect to your VM using SSH" -ForegroundColor White
Write-Host "2. Run the automated deployment script:" -ForegroundColor White
Write-Host "   Invoke-WebRequest -Uri https://raw.githubusercontent.com/AlenTwoTime/deckchatbot-monorepo/main/scripts/deploy-azure.sh -OutFile deploy-azure.sh" -ForegroundColor White
Write-Host "   bash deploy-azure.sh" -ForegroundColor White
Write-Host ""
Write-Host "Optional: Configure a domain name" -ForegroundColor Yellow
Write-Host "1. Point your domain's A record to: $publicIP" -ForegroundColor White
Write-Host "2. After connecting to your VM, run:" -ForegroundColor White
Write-Host "   sudo ./scripts/setup-domain.sh your-domain.com" -ForegroundColor White
Write-Host ""
Write-Host "For more details, refer to the README.md file." -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green
