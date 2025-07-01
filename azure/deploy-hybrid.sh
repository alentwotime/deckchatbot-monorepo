#!/bin/bash
# azure/deploy-hybrid.sh

RESOURCE_GROUP="HybridProjectRG"
STORAGE_ACCOUNT="hybridproject2024"

echo "🚀 Deploying Hybrid + Docker solution..."

# 1. Deploy Frontend to Static Website (Cheapest option)
echo "📤 Deploying frontend to static website..."
cd apps/frontend
npm run build
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --destination '$web' \
  --source "./dist"

# 2. Deploy Backend as Azure Functions (Serverless)
echo "⚡ Deploying backend functions..."
cd ../backend
func azure functionapp publish hybrid-functions

# 3. Deploy AI Service as Container Instance (when needed)
echo "🤖 Deploying AI service container..."
az container create \
  --resource-group $RESOURCE_GROUP \
  --name "ai-service-container" \
  --image "alentwotime/unifiedservices:ai-service" \
  --cpu 1 \
  --memory 2 \
  --ports 8000 \
  --environment-variables \
    "AZURE_AI_KEY=secretref:ai-key"

echo "✅ Hybrid deployment completed!"
