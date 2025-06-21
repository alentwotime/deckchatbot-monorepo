#!/usr/bin/env bash
set -euo pipefail

# This script automates the Azure deployment steps from Deckchatbot_Deployment_Guide.md

# Required environment variables
: "${AZURE_RG?Need AZURE_RG}"       # Resource group
: "${ACR_NAME?Need ACR_NAME}"       # Azure Container Registry name
# Default location to Central US if not provided
LOCATION="${LOCATION:-Central US}"

BACKEND_APP=deckchatbot-backend-app
FRONTEND_APP=deckchatbot-frontend-app

# Optional .env file containing environment variables to pass to the container apps
ENV_FILE=".env"

# Load variables from .env if it exists
if [[ -f "$ENV_FILE" ]]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Collect VAR=value pairs passed as arguments
ENV_VARS=()
for arg in "$@"; do
  if [[ "$arg" == *=* ]]; then
    ENV_VARS+=("$arg")
    export "$arg"
  fi
done

# Ensure Azure CLI is installed
if ! command -v az >/dev/null; then
  echo "Azure CLI not found. Please install it first." >&2
  exit 1
fi

# Verify login
if ! az account show >/dev/null 2>&1; then
  echo "Please run 'az login' before executing this script." >&2
  exit 1
fi

# Create resource group if it doesn't exist
if ! az group show --name "$AZURE_RG" >/dev/null 2>&1; then
  echo "Creating resource group $AZURE_RG in $LOCATION"
  az group create --name "$AZURE_RG" --location "$LOCATION" >/dev/null
fi

# Build and push Docker images to ACR
az acr build --registry "$ACR_NAME" --image deckchatbot-backend:latest -f Dockerfile .
az acr build --registry "$ACR_NAME" --image deckchatbot-frontend:latest -f frontend/Dockerfile ./frontend

# Deploy container apps
az containerapp create --name "$BACKEND_APP" --resource-group "$AZURE_RG" \
  --image "$ACR_NAME.azurecr.io/deckchatbot-backend:latest" --target-port 8000

az containerapp create --name "$FRONTEND_APP" --resource-group "$AZURE_RG" \
  --image "$ACR_NAME.azurecr.io/deckchatbot-frontend:latest" --target-port 3000

# Apply environment variables to the backend container app if any were provided
if [[ ${#ENV_VARS[@]} -gt 0 ]]; then
  az containerapp update --name "$BACKEND_APP" --resource-group "$AZURE_RG" \
    --set-env-vars "${ENV_VARS[@]}"
fi

echo "Deployment complete."
