import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AzureConfigService } from '../../apps/backend/src/services/azure-config'

describe('Azure Configuration Service', () => {
  let azureConfigService: AzureConfigService

  beforeEach(() => {
    // Set up test environment variables
    process.env.AZURE_SUBSCRIPTION_ID = '5bdaf888-486f-4ff4-90ca-2b0c13733d20'
    process.env.AZURE_TENANT_ID = 'f89a754e-daa2-4b90-afa2-057cb641dbf5'
    process.env.AZURE_RESOURCE_GROUP_NAME = 'test-resource-group'
    process.env.AZURE_REGION = 'East US'
    
    // Mock Azure services (since we don't have actual credentials yet)
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-openai.openai.azure.com/'
    process.env.AZURE_OPENAI_API_KEY = 'test-openai-key'
    process.env.AZURE_COSMOSDB_ENDPOINT = 'https://test-cosmos.documents.azure.com:443/'
    process.env.AZURE_COSMOSDB_KEY = 'test-cosmos-key'
    process.env.AZURE_STORAGE_ACCOUNT_NAME = 'teststorageaccount'
    process.env.AZURE_STORAGE_ACCOUNT_KEY = 'test-storage-key'
    
    azureConfigService = AzureConfigService.getInstance()
  })

  describe('Configuration Loading', () => {
    it('should load Azure subscription and tenant IDs correctly', () => {
      const config = azureConfigService.getConfig()
      
      expect(config.subscriptionId).toBe('5bdaf888-486f-4ff4-90ca-2b0c13733d20')
      expect(config.identity.tenantId).toBe('f89a754e-daa2-4b90-afa2-057cb641dbf5')
    })

    it('should load resource group and region correctly', () => {
      const config = azureConfigService.getConfig()
      
      expect(config.resourceGroupName).toBe('test-resource-group')
      expect(config.region).toBe('East US')
    })

    it('should provide identity configuration', () => {
      const identityConfig = azureConfigService.getIdentityConfig()
      
      expect(identityConfig.tenantId).toBe('f89a754e-daa2-4b90-afa2-057cb641dbf5')
      expect(identityConfig).toHaveProperty('clientId')
      expect(identityConfig).toHaveProperty('clientSecret')
    })
  })

  describe('Service Configurations', () => {
    it('should provide OpenAI configuration', () => {
      const openaiConfig = azureConfigService.getOpenAIConfig()
      
      expect(openaiConfig.endpoint).toBe('https://test-openai.openai.azure.com/')
      expect(openaiConfig.apiKey).toBe('test-openai-key')
      expect(openaiConfig.apiVersion).toBe('2024-02-01')
      expect(openaiConfig.deploymentName).toBe('gpt-4')
    })

    it('should provide Cosmos DB configuration', () => {
      const cosmosConfig = azureConfigService.getCosmosDbConfig()
      
      expect(cosmosConfig.endpoint).toBe('https://test-cosmos.documents.azure.com:443/')
      expect(cosmosConfig.key).toBe('test-cosmos-key')
      expect(cosmosConfig.databaseId).toBe('deckchatbot')
    })

    it('should provide Storage configuration', () => {
      const storageConfig = azureConfigService.getStorageConfig()
      
      expect(storageConfig.accountName).toBe('teststorageaccount')
      expect(storageConfig.accountKey).toBe('test-storage-key')
      expect(storageConfig.connectionString).toContain('teststorageaccount')
    })
  })

  describe('Configuration Validation', () => {
    it('should validate OpenAI configuration correctly', () => {
      const isValid = azureConfigService.validateOpenAIConfig()
      expect(isValid).toBe(true)
    })

    it('should validate Cosmos DB configuration correctly', () => {
      const isValid = azureConfigService.validateCosmosDbConfig()
      expect(isValid).toBe(true)
    })

    it('should validate Storage configuration correctly', () => {
      const isValid = azureConfigService.validateStorageConfig()
      expect(isValid).toBe(true)
    })

    it('should validate all configurations correctly', () => {
      const validation = azureConfigService.validateAllConfigs()
      
      expect(validation.openai).toBe(true)
      expect(validation.cosmosDb).toBe(true)
      expect(validation.storage).toBe(true)
      expect(validation.overall).toBe(true)
    })
  })

  describe('Configuration Status', () => {
    it('should provide configuration status', () => {
      const status = azureConfigService.getConfigStatus()
      
      expect(status.configured).toBe(true)
      expect(status.services.openai).toBe(true)
      expect(status.services.cosmosDb).toBe(true)
      expect(status.services.storage).toBe(true)
      expect(status.missingVars).toHaveLength(0)
    })
  })

  describe('Azure Credentials', () => {
    it('should provide DefaultAzureCredential instance', () => {
      const credential = azureConfigService.getCredential()
      expect(credential).toBeDefined()
      expect(credential.constructor.name).toBe('DefaultAzureCredential')
    })
  })

  describe('User-Specific Configuration', () => {
    it('should use the correct subscription ID from user login', () => {
      const config = azureConfigService.getConfig()
      expect(config.subscriptionId).toBe('5bdaf888-486f-4ff4-90ca-2b0c13733d20')
    })

    it('should use the correct tenant ID from user login', () => {
      const config = azureConfigService.getConfig()
      expect(config.identity.tenantId).toBe('f89a754e-daa2-4b90-afa2-057cb641dbf5')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing environment variables gracefully', () => {
      // Clear environment variables
      delete process.env.AZURE_OPENAI_ENDPOINT
      delete process.env.AZURE_OPENAI_API_KEY
      
      // Create new instance to test missing vars
      const testService = AzureConfigService.getInstance()
      const status = testService.getConfigStatus()
      
      expect(status.configured).toBe(false)
      expect(status.missingVars.length).toBeGreaterThan(0)
    })
  })
})
