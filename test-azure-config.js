const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

// Import the Azure config service
const { azureConfig } = require('./apps/backend/src/services/azure-config.ts');

console.log('🔧 Testing Azure Configuration...\n');

try {
  // Test basic configuration loading
  const config = azureConfig.getConfig();
  
  console.log('✅ Azure Configuration loaded successfully!');
  console.log('\n📋 Configuration Summary:');
  console.log(`   Subscription ID: ${config.subscriptionId}`);
  console.log(`   Tenant ID: ${config.identity.tenantId}`);
  console.log(`   Resource Group: ${config.resourceGroupName}`);
  console.log(`   Region: ${config.region}`);
  
  // Test individual service configurations
  console.log('\n🔍 Service Configuration Status:');
  
  const openaiConfig = azureConfig.getOpenAIConfig();
  console.log(`   OpenAI Endpoint: ${openaiConfig.endpoint ? '✅ Set' : '❌ Missing'}`);
  console.log(`   OpenAI API Key: ${openaiConfig.apiKey ? '✅ Set' : '❌ Missing'}`);
  
  const cosmosConfig = azureConfig.getCosmosDbConfig();
  console.log(`   Cosmos DB Endpoint: ${cosmosConfig.endpoint ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Cosmos DB Key: ${cosmosConfig.key ? '✅ Set' : '❌ Missing'}`);
  
  const storageConfig = azureConfig.getStorageConfig();
  console.log(`   Storage Account: ${storageConfig.accountName ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Storage Key: ${storageConfig.accountKey ? '✅ Set' : '❌ Missing'}`);
  
  // Test validation
  console.log('\n🔐 Validation Results:');
  const validation = azureConfig.validateAllConfigs();
  console.log(`   OpenAI Valid: ${validation.openai ? '✅' : '❌'}`);
  console.log(`   Cosmos DB Valid: ${validation.cosmosDb ? '✅' : '❌'}`);
  console.log(`   Storage Valid: ${validation.storage ? '✅' : '❌'}`);
  console.log(`   Overall Valid: ${validation.overall ? '✅' : '❌'}`);
  
  // Test configuration status
  console.log('\n📊 Configuration Status:');
  const status = azureConfig.getConfigStatus();
  console.log(`   Configured: ${status.configured ? '✅' : '❌'}`);
  if (status.missingVars.length > 0) {
    console.log(`   Missing Variables: ${status.missingVars.join(', ')}`);
  }
  
  // Test credential object
  console.log('\n🔑 Azure Credential:');
  const credential = azureConfig.getCredential();
  console.log(`   DefaultAzureCredential: ${credential ? '✅ Initialized' : '❌ Failed'}`);
  
  console.log('\n🎉 Azure configuration test completed!');
  
  if (!validation.overall) {
    console.log('\n⚠️  Warning: Some Azure services are not fully configured.');
    console.log('   Please update the missing credentials in your .env file.');
    console.log('   Refer to AZURE_SECRETS_SETUP.md for detailed instructions.');
  }
  
} catch (error) {
  console.error('❌ Error testing Azure configuration:', error.message);
  console.error('\n🔧 Troubleshooting steps:');
  console.error('   1. Ensure .env file exists in the project root');
  console.error('   2. Check that all required environment variables are set');
  console.error('   3. Verify Azure CLI is logged in: az account show');
  console.error('   4. Review AZURE_SECRETS_SETUP.md for setup instructions');
}
