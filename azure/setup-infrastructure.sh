#!/bin/bash
# azure/setup-infrastructure.sh

RESOURCE_GROUP="HybridProjectRG"
LOCATION="East US"
STORAGE_ACCOUNT="hybridproject2024"

echo "🏗️ Setting up Hybrid Azure infrastructure..."

# Create resource group
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create storage account for static website (Frontend)
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2

# Enable static website hosting
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --404-document "404.html" \
  --index-document "index.html"

# Create Function App for serverless backend
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location "$LOCATION" \
  --runtime "node" \
  --runtime-version "18" \
  --functions-version "4" \
  --name "hybrid-functions" \
  --storage-account $STORAGE_ACCOUNT

# Create database (choose based on needs)
# Option A: Azure SQL (Relational)
az sql server create \
  --name "hybrid-sql-server" \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --admin-user "sqladmin" \
  --admin-password "SecurePass123!"

az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server "hybrid-sql-server" \
  --name "HybridDB" \
  --service-objective "Basic"

# Option B: Cosmos DB (NoSQL - Often Cheaper)
az cosmosdb create \
  --resource-group $RESOURCE_GROUP \
  --name "hybrid-cosmos" \
  --kind "GlobalDocumentDB" \
  --locations regionName="$LOCATION" failoverPriority=0

# Create AI services
az cognitiveservices account create \
  --name "hybrid-ai-services" \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --kind "CognitiveServices" \
  --sku "S0"

echo "✅ Hybrid infrastructure created successfully!"
