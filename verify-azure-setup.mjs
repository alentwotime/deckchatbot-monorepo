import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔧 Verifying Azure Configuration Setup...\n');

// Check if .env file exists and has the correct values
console.log('📋 Environment Variables Check:');
console.log(`   AZURE_SUBSCRIPTION_ID: ${process.env.AZURE_SUBSCRIPTION_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   AZURE_TENANT_ID: ${process.env.AZURE_TENANT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   AZURE_RESOURCE_GROUP_NAME: ${process.env.AZURE_RESOURCE_GROUP_NAME ? '✅ Set' : '❌ Missing'}`);
console.log(`   AZURE_REGION: ${process.env.AZURE_REGION ? '✅ Set' : '❌ Missing'}`);

// Verify the specific values match user's Azure account
console.log('\n🔍 User-Specific Configuration Verification:');
const expectedSubscriptionId = '5bdaf888-486f-4ff4-90ca-2b0c13733d20';
const expectedTenantId = 'f89a754e-daa2-4b90-afa2-057cb641dbf5';

if (process.env.AZURE_SUBSCRIPTION_ID === expectedSubscriptionId) {
  console.log('   ✅ Subscription ID matches user account');
} else {
  console.log(`   ❌ Subscription ID mismatch. Expected: ${expectedSubscriptionId}, Got: ${process.env.AZURE_SUBSCRIPTION_ID}`);
}

if (process.env.AZURE_TENANT_ID === expectedTenantId) {
  console.log('   ✅ Tenant ID matches user account');
} else {
  console.log(`   ❌ Tenant ID mismatch. Expected: ${expectedTenantId}, Got: ${process.env.AZURE_TENANT_ID}`);
}

// Check Azure service configurations
console.log('\n🔧 Azure Service Configuration Status:');
const azureServices = [
  { name: 'OpenAI Endpoint', env: 'AZURE_OPENAI_ENDPOINT' },
  { name: 'OpenAI API Key', env: 'AZURE_OPENAI_API_KEY' },
  { name: 'Cosmos DB Endpoint', env: 'AZURE_COSMOSDB_ENDPOINT' },
  { name: 'Cosmos DB Key', env: 'AZURE_COSMOSDB_KEY' },
  { name: 'Storage Account Name', env: 'AZURE_STORAGE_ACCOUNT_NAME' },
  { name: 'Storage Account Key', env: 'AZURE_STORAGE_ACCOUNT_KEY' },
  { name: 'Computer Vision Endpoint', env: 'AZURE_COMPUTER_VISION_ENDPOINT' },
  { name: 'Computer Vision API Key', env: 'AZURE_COMPUTER_VISION_API_KEY' }
];

let configuredServices = 0;
azureServices.forEach(service => {
  const isSet = process.env[service.env] && process.env[service.env] !== `your-${service.env.toLowerCase().replace('azure_', '').replace(/_/g, '-')}`;
  console.log(`   ${service.name}: ${isSet ? '✅ Configured' : '⚠️  Needs Configuration'}`);
  if (isSet) configuredServices++;
});

console.log(`\n📊 Configuration Summary:`);
console.log(`   Core Azure Settings: ${process.env.AZURE_SUBSCRIPTION_ID && process.env.AZURE_TENANT_ID ? '✅ Complete' : '❌ Incomplete'}`);
console.log(`   Azure Services: ${configuredServices}/${azureServices.length} configured`);

// Check if files were created
console.log('\n📁 Files Created:');
try {
  const fs = await import('fs');
  console.log(`   .env file: ${fs.existsSync('.env') ? '✅ Created' : '❌ Missing'}`);
  console.log(`   AZURE_SECRETS_SETUP.md: ${fs.existsSync('AZURE_SECRETS_SETUP.md') ? '✅ Created' : '❌ Missing'}`);
  console.log(`   Azure config test: ${fs.existsSync('tests/__tests__/azure-config.test.ts') ? '✅ Created' : '❌ Missing'}`);
} catch (error) {
  console.log('   ❌ Error checking files:', error.message);
}

console.log('\n🎯 Next Steps:');
if (configuredServices < azureServices.length) {
  console.log('   1. Create Azure resources (OpenAI, Cosmos DB, Storage, etc.)');
  console.log('   2. Update .env file with actual resource endpoints and keys');
  console.log('   3. Set up GitHub repository secrets for CI/CD');
  console.log('   4. Test the application with real Azure services');
} else {
  console.log('   ✅ All Azure services are configured!');
  console.log('   1. Set up GitHub repository secrets for CI/CD');
  console.log('   2. Test the application deployment');
}

console.log('\n📖 For detailed setup instructions, see: AZURE_SECRETS_SETUP.md');
console.log('🎉 Azure configuration verification completed!');
