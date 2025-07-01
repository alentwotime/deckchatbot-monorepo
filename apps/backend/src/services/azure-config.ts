/**
 * Azure Configuration Management Service
 * Singleton pattern for Azure configuration with environment variable validation
 */

import { DefaultAzureCredential } from '@azure/identity';

export interface AzureConfig {
  // Azure OpenAI Configuration
  openai: {
    endpoint: string;
    apiKey: string;
    apiVersion: string;
    deploymentName: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };

  // Azure Cosmos DB Configuration
  cosmosDb: {
    endpoint: string;
    key: string;
    databaseId: string;
    containers: {
      chats: string;
      sessions: string;
      decks: string;
    };
  };

  // Azure Storage Configuration
  storage: {
    accountName: string;
    accountKey: string;
    connectionString: string;
    containers: {
      decks: string;
      uploads: string;
      exports: string;
    };
  };

  // Azure Identity Configuration
  identity: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
  };

  // General Azure Configuration
  subscriptionId: string;
  resourceGroupName: string;
  region: string;
}

class AzureConfigService {
  private static instance: AzureConfigService;
  private config: AzureConfig;
  private credential: DefaultAzureCredential;

  private constructor() {
    this.validateEnvironmentVariables();
    this.config = this.loadConfiguration();
    this.credential = new DefaultAzureCredential();
  }

  public static getInstance(): AzureConfigService {
    if (!AzureConfigService.instance) {
      AzureConfigService.instance = new AzureConfigService();
    }
    return AzureConfigService.instance;
  }

  /**
   * Validate required environment variables
   */
  private validateEnvironmentVariables(): void {
    const requiredVars = [
      'AZURE_OPENAI_ENDPOINT',
      'AZURE_OPENAI_API_KEY',
      'AZURE_COSMOSDB_ENDPOINT',
      'AZURE_COSMOSDB_KEY',
      'AZURE_STORAGE_ACCOUNT_NAME',
      'AZURE_STORAGE_ACCOUNT_KEY',
      'AZURE_SUBSCRIPTION_ID',
      'AZURE_RESOURCE_GROUP_NAME',
      'AZURE_REGION'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.warn(`⚠️  Warning: Missing Azure environment variables: ${missingVars.join(', ')}`);
      console.warn('Some Azure services may not function properly.');
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): AzureConfig {
    return {
      openai: {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
        apiKey: process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
        model: process.env.AZURE_OPENAI_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE || '0.7')
      },
      cosmosDb: {
        endpoint: process.env.AZURE_COSMOSDB_ENDPOINT || '',
        key: process.env.AZURE_COSMOSDB_KEY || '',
        databaseId: process.env.AZURE_COSMOSDB_DATABASE_ID || 'deckchatbot',
        containers: {
          chats: process.env.AZURE_COSMOSDB_CHATS_CONTAINER || 'chats',
          sessions: process.env.AZURE_COSMOSDB_SESSIONS_CONTAINER || 'sessions',
          decks: process.env.AZURE_COSMOSDB_DECKS_CONTAINER || 'decks'
        }
      },
      storage: {
        accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
        accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || 
          `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${process.env.AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`,
        containers: {
          decks: process.env.AZURE_STORAGE_DECKS_CONTAINER || 'decks',
          uploads: process.env.AZURE_STORAGE_UPLOADS_CONTAINER || 'uploads',
          exports: process.env.AZURE_STORAGE_EXPORTS_CONTAINER || 'exports'
        }
      },
      identity: {
        tenantId: process.env.AZURE_TENANT_ID || '',
        clientId: process.env.AZURE_CLIENT_ID || '',
        clientSecret: process.env.AZURE_CLIENT_SECRET || ''
      },
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      resourceGroupName: process.env.AZURE_RESOURCE_GROUP_NAME || '',
      region: process.env.AZURE_REGION || 'East US'
    };
  }

  /**
   * Get the complete Azure configuration
   */
  public getConfig(): AzureConfig {
    return { ...this.config };
  }

  /**
   * Get Azure OpenAI configuration
   */
  public getOpenAIConfig() {
    return { ...this.config.openai };
  }

  /**
   * Get Azure Cosmos DB configuration
   */
  public getCosmosDbConfig() {
    return { ...this.config.cosmosDb };
  }

  /**
   * Get Azure Storage configuration
   */
  public getStorageConfig() {
    return { ...this.config.storage };
  }

  /**
   * Get Azure Identity configuration
   */
  public getIdentityConfig() {
    return { ...this.config.identity };
  }

  /**
   * Get Azure credentials
   */
  public getCredential(): DefaultAzureCredential {
    return this.credential;
  }

  /**
   * Validate Azure OpenAI configuration
   */
  public validateOpenAIConfig(): boolean {
    const openaiConfig = this.config.openai;
    return !!(openaiConfig.endpoint && openaiConfig.apiKey);
  }

  /**
   * Validate Azure Cosmos DB configuration
   */
  public validateCosmosDbConfig(): boolean {
    const cosmosConfig = this.config.cosmosDb;
    return !!(cosmosConfig.endpoint && cosmosConfig.key && cosmosConfig.databaseId);
  }

  /**
   * Validate Azure Storage configuration
   */
  public validateStorageConfig(): boolean {
    const storageConfig = this.config.storage;
    return !!(storageConfig.accountName && storageConfig.accountKey);
  }

  /**
   * Validate all Azure configurations
   */
  public validateAllConfigs(): {
    openai: boolean;
    cosmosDb: boolean;
    storage: boolean;
    overall: boolean;
  } {
    const openai = this.validateOpenAIConfig();
    const cosmosDb = this.validateCosmosDbConfig();
    const storage = this.validateStorageConfig();

    return {
      openai,
      cosmosDb,
      storage,
      overall: openai && cosmosDb && storage
    };
  }

  /**
   * Update configuration (useful for testing or runtime updates)
   */
  public updateConfig(updates: Partial<AzureConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get configuration status for health checks
   */
  public getConfigStatus(): {
    configured: boolean;
    services: {
      openai: boolean;
      cosmosDb: boolean;
      storage: boolean;
    };
    missingVars: string[];
  } {
    const validation = this.validateAllConfigs();
    const requiredVars = [
      'AZURE_OPENAI_ENDPOINT',
      'AZURE_OPENAI_API_KEY',
      'AZURE_COSMOSDB_ENDPOINT',
      'AZURE_COSMOSDB_KEY',
      'AZURE_STORAGE_ACCOUNT_NAME',
      'AZURE_STORAGE_ACCOUNT_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    return {
      configured: validation.overall,
      services: {
        openai: validation.openai,
        cosmosDb: validation.cosmosDb,
        storage: validation.storage
      },
      missingVars
    };
  }
}

// Export singleton instance
export const azureConfig = AzureConfigService.getInstance();
export default azureConfig;
