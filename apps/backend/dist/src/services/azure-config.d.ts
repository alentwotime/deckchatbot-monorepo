/**
 * Azure Configuration Management Service
 * Singleton pattern for Azure configuration with environment variable validation
 */
import { DefaultAzureCredential } from '@azure/identity';
export interface AzureConfig {
    openai: {
        endpoint: string;
        apiKey: string;
        apiVersion: string;
        deploymentName: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
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
    identity: {
        tenantId: string;
        clientId: string;
        clientSecret: string;
    };
    subscriptionId: string;
    resourceGroupName: string;
    region: string;
}
declare class AzureConfigService {
    private static instance;
    private config;
    private credential;
    private constructor();
    static getInstance(): AzureConfigService;
    /**
     * Validate required environment variables
     */
    private validateEnvironmentVariables;
    /**
     * Load configuration from environment variables
     */
    private loadConfiguration;
    /**
     * Get the complete Azure configuration
     */
    getConfig(): AzureConfig;
    /**
     * Get Azure OpenAI configuration
     */
    getOpenAIConfig(): {
        endpoint: string;
        apiKey: string;
        apiVersion: string;
        deploymentName: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
    /**
     * Get Azure Cosmos DB configuration
     */
    getCosmosDbConfig(): {
        endpoint: string;
        key: string;
        databaseId: string;
        containers: {
            chats: string;
            sessions: string;
            decks: string;
        };
    };
    /**
     * Get Azure Storage configuration
     */
    getStorageConfig(): {
        accountName: string;
        accountKey: string;
        connectionString: string;
        containers: {
            decks: string;
            uploads: string;
            exports: string;
        };
    };
    /**
     * Get Azure Identity configuration
     */
    getIdentityConfig(): {
        tenantId: string;
        clientId: string;
        clientSecret: string;
    };
    /**
     * Get Azure credentials
     */
    getCredential(): DefaultAzureCredential;
    /**
     * Validate Azure OpenAI configuration
     */
    validateOpenAIConfig(): boolean;
    /**
     * Validate Azure Cosmos DB configuration
     */
    validateCosmosDbConfig(): boolean;
    /**
     * Validate Azure Storage configuration
     */
    validateStorageConfig(): boolean;
    /**
     * Validate all Azure configurations
     */
    validateAllConfigs(): {
        openai: boolean;
        cosmosDb: boolean;
        storage: boolean;
        overall: boolean;
    };
    /**
     * Update configuration (useful for testing or runtime updates)
     */
    updateConfig(updates: Partial<AzureConfig>): void;
    /**
     * Get configuration status for health checks
     */
    getConfigStatus(): {
        configured: boolean;
        services: {
            openai: boolean;
            cosmosDb: boolean;
            storage: boolean;
        };
        missingVars: string[];
    };
}
export declare const azureConfig: AzureConfigService;
export default azureConfig;
//# sourceMappingURL=azure-config.d.ts.map