/**
 * Azure Services Test
 * Simple test to verify all Azure services can be imported and initialized
 */
import { azureConfig } from './azure-config.js';
import { azureOpenAI } from './azure-openai.js';
import { azureCosmos } from './azure-cosmos.js';
import { azureStorage } from './azure-storage.js';
/**
 * Test all Azure services
 */
export declare function testAzureServices(): Promise<{
    config: any;
    openai: any;
    cosmos: any;
    storage: any;
    overall: boolean;
}>;
/**
 * Test Azure OpenAI functionality (if configured)
 */
export declare function testOpenAIFunctionality(): Promise<void>;
/**
 * Test Azure Cosmos DB functionality (if configured)
 */
export declare function testCosmosFunctionality(): Promise<void>;
/**
 * Test Azure Storage functionality (if configured)
 */
export declare function testStorageFunctionality(): Promise<void>;
/**
 * Run all tests
 */
export declare function runAllTests(): Promise<void>;
export { azureConfig, azureOpenAI, azureCosmos, azureStorage };
//# sourceMappingURL=azure-services-test.d.ts.map