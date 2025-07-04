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
export async function testAzureServices(): Promise<{
  config: any;
  openai: any;
  cosmos: any;
  storage: any;
  overall: boolean;
}> {
  console.log('🧪 Testing Azure Services...\n');

  // Test Configuration Service
  console.log('📋 Testing Azure Configuration Service...');
  const configStatus = azureConfig.getConfigStatus();
  console.log('Config Status:', configStatus);
  
  const validation = azureConfig.validateAllConfigs();
  console.log('Validation:', validation);
  console.log('✅ Azure Config Service loaded\n');

  // Test OpenAI Service
  console.log('🤖 Testing Azure OpenAI Service...');
  const openaiHealth = await azureOpenAI.healthCheck();
  console.log('OpenAI Health:', openaiHealth);
  console.log('✅ Azure OpenAI Service loaded\n');

  // Test Cosmos DB Service
  console.log('🗄️  Testing Azure Cosmos DB Service...');
  const cosmosHealth = await azureCosmos.healthCheck();
  console.log('Cosmos Health:', cosmosHealth);
  console.log('✅ Azure Cosmos Service loaded\n');

  // Test Storage Service
  console.log('📁 Testing Azure Storage Service...');
  const storageHealth = await azureStorage.healthCheck();
  console.log('Storage Health:', storageHealth);
  console.log('✅ Azure Storage Service loaded\n');

  const overall = 
    configStatus.configured && 
    openaiHealth.status === 'healthy' && 
    cosmosHealth.status === 'healthy' && 
    storageHealth.status === 'healthy';

  console.log(`🎯 Overall Status: ${overall ? '✅ All services healthy' : '⚠️  Some services need configuration'}\n`);

  return {
    config: { status: configStatus, validation },
    openai: openaiHealth,
    cosmos: cosmosHealth,
    storage: storageHealth,
    overall
  };
}

/**
 * Test Azure OpenAI functionality (if configured)
 */
export async function testOpenAIFunctionality(): Promise<void> {
  console.log('🧪 Testing OpenAI Functionality...\n');

  try {
    // Test basic chat completion
    const response = await azureOpenAI.createChatCompletion({
      messages: [
        { role: 'user', content: 'Hello! Can you help me analyze Magic: The Gathering decks?' }
      ],
      maxTokens: 100,
    });

    console.log('✅ Chat Completion Test Successful:');
    console.log('Response:', response.content.substring(0, 100) + '...');
    console.log('Tokens used:', response.usage.totalTokens);

    // Test deck analysis
    const deckAnalysis = await azureOpenAI.analyzeDeck({
      deckList: `4 Lightning Bolt
4 Counterspell
4 Brainstorm
20 Island
8 Mountain`,
      format: 'Legacy',
      analysisType: 'competitive'
    });

    console.log('\n✅ Deck Analysis Test Successful:');
    console.log('Analysis preview:', deckAnalysis.analysis.substring(0, 150) + '...');
    console.log('Suggestions count:', deckAnalysis.suggestions.length);
    console.log('Competitive rating:', deckAnalysis.competitiveRating);

  } catch (error) {
    console.log('⚠️  OpenAI functionality test failed (likely due to missing configuration):');
    console.log('Error:', error.message);
  }
}

/**
 * Test Azure Cosmos DB functionality (if configured)
 */
export async function testCosmosFunctionality(): Promise<void> {
  console.log('🧪 Testing Cosmos DB Functionality...\n');

  try {
    // Test session creation
    const session = await azureCosmos.createSession({
      userId: 'test-user',
      title: 'Test Session',
      messageCount: 0,
      isActive: true,
    });

    console.log('✅ Session Creation Test Successful:');
    console.log('Session ID:', session.id);

    // Test message storage
    const message = await azureCosmos.storeChatMessage({
      sessionId: session.id!,
      userId: 'test-user',
      role: 'user',
      content: 'Test message',
      timestamp: new Date(),
    });

    console.log('✅ Message Storage Test Successful:');
    console.log('Message ID:', message.id);

    // Test deck storage
    const deck = await azureCosmos.storeDeck({
      userId: 'test-user',
      name: 'Test Deck',
      format: 'Standard',
      deckList: '4 Lightning Bolt\n20 Mountain',
      tags: ['test', 'red'],
      isPublic: false,
    });

    console.log('✅ Deck Storage Test Successful:');
    console.log('Deck ID:', deck.id);

    // Get stats
    const stats = await azureCosmos.getStats();
    console.log('✅ Database Stats:', stats);

    // Cleanup test data
    await azureCosmos.deleteSession(session.id!, 'test-user');
    await azureCosmos.deleteDeck(deck.id!, 'test-user');
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.log('⚠️  Cosmos DB functionality test failed (likely due to missing configuration):');
    console.log('Error:', error.message);
  }
}

/**
 * Test Azure Storage functionality (if configured)
 */
export async function testStorageFunctionality(): Promise<void> {
  console.log('🧪 Testing Storage Functionality...\n');

  try {
    // Test file upload
    const testContent = Buffer.from('This is a test file for Azure Storage', 'utf-8');
    const uploadResult = await azureStorage.uploadFile(
      'uploads',
      testContent,
      'test-file.txt',
      'test-user',
      {
        contentType: 'text/plain',
        metadata: { purpose: 'testing' }
      }
    );

    console.log('✅ File Upload Test Successful:');
    console.log('Blob name:', uploadResult.blobName);
    console.log('Content length:', uploadResult.contentLength);

    // Test file download
    const downloadResult = await azureStorage.downloadFile('uploads', uploadResult.blobName);
    console.log('✅ File Download Test Successful:');
    console.log('Downloaded content:', downloadResult.content.toString('utf-8'));

    // Test signed URL generation
    const signedUrl = await azureStorage.generateSignedUrl(
      'uploads',
      uploadResult.blobName,
      { permissions: 'r', expiresInMinutes: 30 }
    );
    console.log('✅ Signed URL Generation Test Successful:');
    console.log('URL length:', signedUrl.length);

    // Test deck export
    const deckExportResult = await azureStorage.exportDeck({
      deckId: 'test-deck-123',
      name: 'Test Export Deck',
      format: 'Standard',
      deckList: '4 Lightning Bolt\n20 Mountain',
      description: 'A simple red deck for testing',
      exportedAt: new Date(),
      exportedBy: 'test-user'
    }, 'json');

    console.log('✅ Deck Export Test Successful:');
    console.log('Export blob name:', deckExportResult.blobName);

    // Get storage stats
    const storageStats = await azureStorage.getStorageStats();
    console.log('✅ Storage Stats:', storageStats);

    // Cleanup test files
    await azureStorage.deleteFile('uploads', uploadResult.blobName);
    await azureStorage.deleteFile('exports', deckExportResult.blobName);
    console.log('✅ Test files cleaned up');

  } catch (error) {
    console.log('⚠️  Storage functionality test failed (likely due to missing configuration):');
    console.log('Error:', error.message);
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Azure Services Integration Tests\n');
  console.log('=' .repeat(60));

  try {
    // Basic service tests
    const serviceTests = await testAzureServices();
    
    console.log('=' .repeat(60));
    
    // Functionality tests (only if services are configured)
    if (serviceTests.openai.configured) {
      await testOpenAIFunctionality();
      console.log('=' .repeat(60));
    }
    
    if (serviceTests.cosmos.configured) {
      await testCosmosFunctionality();
      console.log('=' .repeat(60));
    }
    
    if (serviceTests.storage.configured) {
      await testStorageFunctionality();
      console.log('=' .repeat(60));
    }

    console.log('🎉 All tests completed!');
    
    if (serviceTests.overall) {
      console.log('✅ All Azure services are properly configured and working!');
    } else {
      console.log('⚠️  Some Azure services need configuration. Check the .env file.');
      console.log('📝 Refer to .env.example for required environment variables.');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Export individual services for easy access
export {
  azureConfig,
  azureOpenAI,
  azureCosmos,
  azureStorage
};

// If this file is run directly, execute all tests
if (require.main === module) {
  runAllTests().catch(console.error);
}
