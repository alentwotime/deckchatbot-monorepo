# Azure Secrets Configuration Guide

This document provides instructions for setting up Azure credentials and secrets for the DeckChatBot project.

## Environment Variables (.env file)

The `.env` file has been created with your Azure credentials. The following values have been updated with your actual Azure information:

- `AZURE_SUBSCRIPTION_ID=5bdaf888-486f-4ff4-90ca-2b0c13733d20`
- `AZURE_TENANT_ID=f89a754e-daa2-4b90-afa2-057cb641dbf5`

## GitHub Repository Secrets

To enable CI/CD deployment to Azure, you need to configure the following secrets in your GitHub repository:

### Required GitHub Secrets

1. **AZURE_CREDENTIALS**
   - This is a JSON object containing service principal credentials
   - Format:
   ```json
   {
     "clientId": "your-client-id",
     "clientSecret": "your-client-secret",
     "subscriptionId": "5bdaf888-486f-4ff4-90ca-2b0c13733d20",
     "tenantId": "f89a754e-daa2-4b90-afa2-057cb641dbf5"
   }
   ```

2. **AZURE_CONTAINER_REGISTRY**
   - Your Azure Container Registry URL
   - Example: `yourregistry.azurecr.io`

3. **AZURE_ACR_USERNAME**
   - Azure Container Registry username

4. **AZURE_ACR_PASSWORD**
   - Azure Container Registry password

5. **AZURE_RESOURCE_GROUP**
   - Your Azure Resource Group name
   - Example: `deckchatbot-rg`

6. **SLACK_WEBHOOK** (Optional)
   - Slack webhook URL for deployment notifications

## How to Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the name and value as specified above

## Creating Azure Service Principal

To create the service principal for AZURE_CREDENTIALS, run these Azure CLI commands:

```bash
# Create a service principal
az ad sp create-for-rbac --name "deckchatbot-sp" --role contributor --scopes /subscriptions/5bdaf888-486f-4ff4-90ca-2b0c13733d20 --sdk-auth

# This will output JSON that you can use for AZURE_CREDENTIALS secret
```

## Azure Resources Setup

You'll also need to create the following Azure resources and update the corresponding environment variables:

### 1. Azure OpenAI Service
- Create an Azure OpenAI resource
- Update `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY` in .env

### 2. Azure Cosmos DB
- Create a Cosmos DB account
- Update `AZURE_COSMOSDB_ENDPOINT` and `AZURE_COSMOSDB_KEY` in .env

### 3. Azure Storage Account
- Create a storage account
- Update `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` in .env

### 4. Azure Computer Vision
- Create a Computer Vision resource
- Update `AZURE_COMPUTER_VISION_ENDPOINT` and `AZURE_COMPUTER_VISION_API_KEY` in .env

### 5. Azure Container Registry
- Create an Azure Container Registry
- Update the GitHub secrets with ACR details

### 6. Azure App Service
- Create an App Service for hosting the application
- Update `AZURE_WEBAPP_NAME` in the GitHub workflow if needed

## Security Notes

- The `.env` file is already added to `.gitignore` to prevent committing secrets
- Never commit actual credentials to the repository
- Use GitHub secrets for CI/CD pipeline credentials
- Regularly rotate your Azure credentials for security

## Your Current Azure Account Details

Based on your Azure CLI login:
- **Subscription ID**: 5bdaf888-486f-4ff4-90ca-2b0c13733d20
- **Tenant ID**: f89a754e-daa2-4b90-afa2-057cb641dbf5
- **User Email**: aklints26@gmail.com
- **Tenant Domain**: aklints26gmail.onmicrosoft.com

## Next Steps

1. Create the required Azure resources listed above
2. Update the .env file with the actual resource endpoints and keys
3. Set up the GitHub repository secrets
4. Test the deployment pipeline

## Troubleshooting

If you encounter authentication issues:
1. Verify your Azure CLI is logged in: `az account show`
2. Check that your service principal has the correct permissions
3. Ensure all required secrets are set in GitHub
4. Verify the resource group and subscription IDs are correct
