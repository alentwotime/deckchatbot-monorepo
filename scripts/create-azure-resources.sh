#!/bin/bash

# Azure Resource Provisioning Script for DeckChatbot
# This script creates all required Azure services with proper configuration
# and outputs connection strings and keys to update your .env file

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_config() {
    echo -e "${CYAN}[CONFIG]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate random string
generate_random_string() {
    local length=${1:-8}
    echo $(openssl rand -hex $length | cut -c1-$length)
}

print_status "Starting Azure Resource Provisioning for DeckChatbot..."

# Check if Azure CLI is installed
if ! command_exists az; then
    print_error "Azure CLI not found. Please install it first:"
    print_error "curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    exit 1
fi

# Load environment variables from .env file
if [ -f ".env" ]; then
    print_status "Loading configuration from .env file..."
    # Fix line endings and export variables safely
    set -a
    source <(grep -v '^#' .env | grep -v '^$' | sed 's/\r$//')
    set +a
else
    print_error ".env file not found. Please ensure it exists with Azure credentials."
    exit 1
fi

# Validate required environment variables
if [ -z "$AZURE_CLIENT_ID" ] || [ -z "$AZURE_CLIENT_SECRET" ] || [ -z "$AZURE_TENANT_ID" ] || [ -z "$AZURE_SUBSCRIPTION_ID" ]; then
    print_error "Missing required Azure credentials in .env file:"
    print_error "AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID"
    exit 1
fi

# Configuration variables
RESOURCE_GROUP_NAME=${AZURE_RESOURCE_GROUP_NAME:-"deckchatbot-rg"}
LOCATION=${AZURE_REGION:-"East US"}
PROJECT_NAME="deckchatbot"
RANDOM_SUFFIX=$(generate_random_string 6)

# Resource names (must be globally unique for some services)
STORAGE_ACCOUNT_NAME="${PROJECT_NAME}storage${RANDOM_SUFFIX}"
COSMOSDB_ACCOUNT_NAME="${PROJECT_NAME}-cosmos-${RANDOM_SUFFIX}"
OPENAI_ACCOUNT_NAME="${PROJECT_NAME}-openai-${RANDOM_SUFFIX}"
COMPUTER_VISION_NAME="${PROJECT_NAME}-vision-${RANDOM_SUFFIX}"
CONTAINER_REGISTRY_NAME="${PROJECT_NAME}acr${RANDOM_SUFFIX}"
KEY_VAULT_NAME="${PROJECT_NAME}-kv-${RANDOM_SUFFIX}"
APP_SERVICE_PLAN_NAME="${PROJECT_NAME}-plan"
WEB_APP_NAME="${PROJECT_NAME}-app-${RANDOM_SUFFIX}"

print_status "Using configuration:"
print_config "Resource Group: $RESOURCE_GROUP_NAME"
print_config "Location: $LOCATION"
print_config "Random Suffix: $RANDOM_SUFFIX"

# Login to Azure using service principal
print_status "Logging in to Azure..."
az login --service-principal \
  --username "$AZURE_CLIENT_ID" \
  --password "$AZURE_CLIENT_SECRET" \
  --tenant "$AZURE_TENANT_ID" > /dev/null

# Set subscription
print_status "Setting Azure subscription..."
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

print_success "Successfully authenticated with Azure"

# Create Resource Group
print_status "Creating resource group: $RESOURCE_GROUP_NAME"
az group create \
  --name "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --tags project="deckchatbot" environment="production" > /dev/null

print_success "Resource group created successfully"

# Create Azure Storage Account
print_status "Creating Azure Storage Account: $STORAGE_ACCOUNT_NAME"
az storage account create \
  --name "$STORAGE_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot \
  --tags project="deckchatbot" > /dev/null

# Get storage account key
STORAGE_KEY=$(az storage account keys list \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --query '[0].value' -o tsv)

# Create storage containers
print_status "Creating storage containers..."
az storage container create --name "decks" --account-name "$STORAGE_ACCOUNT_NAME" --account-key "$STORAGE_KEY" > /dev/null
az storage container create --name "uploads" --account-name "$STORAGE_ACCOUNT_NAME" --account-key "$STORAGE_KEY" > /dev/null
az storage container create --name "exports" --account-name "$STORAGE_ACCOUNT_NAME" --account-key "$STORAGE_KEY" > /dev/null

print_success "Storage account and containers created successfully"

# Create Azure Cosmos DB
print_status "Creating Azure Cosmos DB: $COSMOSDB_ACCOUNT_NAME"
az cosmosdb create \
  --name "$COSMOSDB_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --locations regionName="$LOCATION" failoverPriority=0 isZoneRedundant=False \
  --default-consistency-level Session \
  --tags project="deckchatbot" > /dev/null

# Create Cosmos DB database and containers
print_status "Creating Cosmos DB database and containers..."
az cosmosdb sql database create \
  --account-name "$COSMOSDB_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --name "deckchatbot" > /dev/null

az cosmosdb sql container create \
  --account-name "$COSMOSDB_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --database-name "deckchatbot" \
  --name "chats" \
  --partition-key-path "/id" > /dev/null

az cosmosdb sql container create \
  --account-name "$COSMOSDB_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --database-name "deckchatbot" \
  --name "sessions" \
  --partition-key-path "/id" > /dev/null

az cosmosdb sql container create \
  --account-name "$COSMOSDB_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --database-name "deckchatbot" \
  --name "decks" \
  --partition-key-path "/id" > /dev/null

# Get Cosmos DB connection details
COSMOSDB_ENDPOINT=$(az cosmosdb show \
  --name "$COSMOSDB_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --query documentEndpoint -o tsv)

COSMOSDB_KEY=$(az cosmosdb keys list \
  --name "$COSMOSDB_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --query primaryMasterKey -o tsv)

print_success "Cosmos DB created successfully"

# Create Azure OpenAI Service
print_status "Creating Azure OpenAI Service: $OPENAI_ACCOUNT_NAME"
az cognitiveservices account create \
  --name "$OPENAI_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --kind OpenAI \
  --sku S0 \
  --tags project="deckchatbot" > /dev/null

# Get OpenAI details
OPENAI_ENDPOINT=$(az cognitiveservices account show \
  --name "$OPENAI_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --query properties.endpoint -o tsv)

OPENAI_KEY=$(az cognitiveservices account keys list \
  --name "$OPENAI_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --query key1 -o tsv)

print_success "Azure OpenAI Service created successfully"

# Create Azure Computer Vision
print_status "Creating Azure Computer Vision: $COMPUTER_VISION_NAME"
az cognitiveservices account create \
  --name "$COMPUTER_VISION_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --kind ComputerVision \
  --sku S1 \
  --tags project="deckchatbot" > /dev/null

# Get Computer Vision details
COMPUTER_VISION_ENDPOINT=$(az cognitiveservices account show \
  --name "$COMPUTER_VISION_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --query properties.endpoint -o tsv)

COMPUTER_VISION_KEY=$(az cognitiveservices account keys list \
  --name "$COMPUTER_VISION_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --query key1 -o tsv)

print_success "Computer Vision service created successfully"

# Create Azure Container Registry
print_status "Creating Azure Container Registry: $CONTAINER_REGISTRY_NAME"
az acr create \
  --name "$CONTAINER_REGISTRY_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --sku Basic \
  --admin-enabled true \
  --tags project="deckchatbot" > /dev/null

# Get ACR details
ACR_LOGIN_SERVER=$(az acr show \
  --name "$CONTAINER_REGISTRY_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --query loginServer -o tsv)

ACR_CREDENTIALS=$(az acr credential show \
  --name "$CONTAINER_REGISTRY_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME")

ACR_USERNAME=$(echo $ACR_CREDENTIALS | jq -r .username)
ACR_PASSWORD=$(echo $ACR_CREDENTIALS | jq -r .passwords[0].value)

print_success "Container Registry created successfully"

# Create Azure Key Vault
print_status "Creating Azure Key Vault: $KEY_VAULT_NAME"
az keyvault create \
  --name "$KEY_VAULT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --sku standard \
  --tags project="deckchatbot" > /dev/null

print_success "Key Vault created successfully"

# Create App Service Plan
print_status "Creating App Service Plan: $APP_SERVICE_PLAN_NAME"
az appservice plan create \
  --name "$APP_SERVICE_PLAN_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --sku B2 \
  --is-linux \
  --tags project="deckchatbot" > /dev/null

# Create Web App
print_status "Creating Web App: $WEB_APP_NAME"
az webapp create \
  --name "$WEB_APP_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --plan "$APP_SERVICE_PLAN_NAME" \
  --runtime "NODE|18-lts" \
  --tags project="deckchatbot" > /dev/null

print_success "App Service created successfully"

# Generate storage connection string
STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=${STORAGE_ACCOUNT_NAME};AccountKey=${STORAGE_KEY};EndpointSuffix=core.windows.net"

print_success "All Azure resources created successfully!"

# Output configuration for .env file
echo ""
print_status "=== CONFIGURATION VALUES FOR YOUR .env FILE ==="
echo ""
print_config "# ==================== AZURE OPENAI (PRIMARY SERVICE) ===================="
print_config "AZURE_OPENAI_ENDPOINT=$OPENAI_ENDPOINT"
print_config "AZURE_OPENAI_API_KEY=$OPENAI_KEY"
print_config "AZURE_OPENAI_API_VERSION=2024-02-01"
print_config "AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4"
print_config "AZURE_OPENAI_MODEL=gpt-4"
print_config "AZURE_OPENAI_MAX_TOKENS=4000"
print_config "AZURE_OPENAI_TEMPERATURE=0.7"
echo ""
print_config "# ==================== AZURE COSMOS DB ===================="
print_config "AZURE_COSMOSDB_ENDPOINT=$COSMOSDB_ENDPOINT"
print_config "AZURE_COSMOSDB_KEY=$COSMOSDB_KEY"
print_config "AZURE_COSMOSDB_DATABASE_ID=deckchatbot"
print_config "AZURE_COSMOSDB_CHATS_CONTAINER=chats"
print_config "AZURE_COSMOSDB_SESSIONS_CONTAINER=sessions"
print_config "AZURE_COSMOSDB_DECKS_CONTAINER=decks"
echo ""
print_config "# ==================== AZURE STORAGE ===================="
print_config "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONNECTION_STRING"
print_config "AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_NAME"
print_config "AZURE_STORAGE_ACCOUNT_KEY=$STORAGE_KEY"
print_config "AZURE_STORAGE_DECKS_CONTAINER=decks"
print_config "AZURE_STORAGE_UPLOADS_CONTAINER=uploads"
print_config "AZURE_STORAGE_EXPORTS_CONTAINER=exports"
echo ""
print_config "# ==================== AZURE COMPUTER VISION ===================="
print_config "AZURE_COMPUTER_VISION_ENDPOINT=$COMPUTER_VISION_ENDPOINT"
print_config "AZURE_COMPUTER_VISION_API_KEY=$COMPUTER_VISION_KEY"
echo ""
print_config "# ==================== AZURE CONTAINER REGISTRY ===================="
print_config "AZURE_CONTAINER_REGISTRY=$ACR_LOGIN_SERVER"
print_config "AZURE_ACR_USERNAME=$ACR_USERNAME"
print_config "AZURE_ACR_PASSWORD=$ACR_PASSWORD"
echo ""
print_config "# ==================== AZURE APP SERVICE ===================="
print_config "AZURE_WEBAPP_NAME=$WEB_APP_NAME"
print_config "AZURE_WEBAPP_URL=https://${WEB_APP_NAME}.azurewebsites.net"
echo ""
print_config "# ==================== AZURE KEY VAULT ===================="
print_config "AZURE_KEY_VAULT_NAME=$KEY_VAULT_NAME"
print_config "AZURE_KEY_VAULT_URL=https://${KEY_VAULT_NAME}.vault.azure.net/"
echo ""

# Save configuration to file
CONFIG_FILE="azure-resources-config.env"
print_status "Saving configuration to $CONFIG_FILE..."

cat > "$CONFIG_FILE" << EOF
# Azure Resources Configuration - Generated $(date)
# Copy these values to your .env file

# ==================== AZURE OPENAI (PRIMARY SERVICE) ====================
AZURE_OPENAI_ENDPOINT=$OPENAI_ENDPOINT
AZURE_OPENAI_API_KEY=$OPENAI_KEY
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_MODEL=gpt-4
AZURE_OPENAI_MAX_TOKENS=4000
AZURE_OPENAI_TEMPERATURE=0.7

# ==================== AZURE COSMOS DB ====================
AZURE_COSMOSDB_ENDPOINT=$COSMOSDB_ENDPOINT
AZURE_COSMOSDB_KEY=$COSMOSDB_KEY
AZURE_COSMOSDB_DATABASE_ID=deckchatbot
AZURE_COSMOSDB_CHATS_CONTAINER=chats
AZURE_COSMOSDB_SESSIONS_CONTAINER=sessions
AZURE_COSMOSDB_DECKS_CONTAINER=decks

# ==================== AZURE STORAGE ====================
AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONNECTION_STRING
AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_NAME
AZURE_STORAGE_ACCOUNT_KEY=$STORAGE_KEY
AZURE_STORAGE_DECKS_CONTAINER=decks
AZURE_STORAGE_UPLOADS_CONTAINER=uploads
AZURE_STORAGE_EXPORTS_CONTAINER=exports

# ==================== AZURE COMPUTER VISION ====================
AZURE_COMPUTER_VISION_ENDPOINT=$COMPUTER_VISION_ENDPOINT
AZURE_COMPUTER_VISION_API_KEY=$COMPUTER_VISION_KEY

# ==================== AZURE CONTAINER REGISTRY ====================
AZURE_CONTAINER_REGISTRY=$ACR_LOGIN_SERVER
AZURE_ACR_USERNAME=$ACR_USERNAME
AZURE_ACR_PASSWORD=$ACR_PASSWORD

# ==================== AZURE APP SERVICE ====================
AZURE_WEBAPP_NAME=$WEB_APP_NAME
AZURE_WEBAPP_URL=https://${WEB_APP_NAME}.azurewebsites.net

# ==================== AZURE KEY VAULT ====================
AZURE_KEY_VAULT_NAME=$KEY_VAULT_NAME
AZURE_KEY_VAULT_URL=https://${KEY_VAULT_NAME}.vault.azure.net/

# ==================== AZURE CONFIGURATION ====================
AZURE_RESOURCE_GROUP_NAME=$RESOURCE_GROUP_NAME
AZURE_REGION=$LOCATION
EOF

print_success "Configuration saved to $CONFIG_FILE"

echo ""
print_status "=== NEXT STEPS ==="
print_warning "1. Copy the configuration values above to your .env file"
print_warning "2. Deploy GPT-4 model to your Azure OpenAI service:"
print_warning "   az cognitiveservices account deployment create \\"
print_warning "     --name $OPENAI_ACCOUNT_NAME \\"
print_warning "     --resource-group $RESOURCE_GROUP_NAME \\"
print_warning "     --deployment-name gpt-4 \\"
print_warning "     --model-name gpt-4 \\"
print_warning "     --model-version 0613 \\"
print_warning "     --model-format OpenAI \\"
print_warning "     --scale-settings-scale-type Standard"
print_warning "3. Configure your application to use the new Azure services"
print_warning "4. Test your application with the new configuration"

echo ""
print_success "Azure resource provisioning completed successfully!"
print_success "Total resources created: 8 services across $RESOURCE_GROUP_NAME resource group"

# Store resource information for cleanup script
cat > "azure-resources-info.json" << EOF
{
  "resourceGroup": "$RESOURCE_GROUP_NAME",
  "location": "$LOCATION",
  "resources": {
    "storageAccount": "$STORAGE_ACCOUNT_NAME",
    "cosmosDb": "$COSMOSDB_ACCOUNT_NAME",
    "openAI": "$OPENAI_ACCOUNT_NAME",
    "computerVision": "$COMPUTER_VISION_NAME",
    "containerRegistry": "$CONTAINER_REGISTRY_NAME",
    "keyVault": "$KEY_VAULT_NAME",
    "appServicePlan": "$APP_SERVICE_PLAN_NAME",
    "webApp": "$WEB_APP_NAME"
  },
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

print_status "Resource information saved to azure-resources-info.json for future reference"
