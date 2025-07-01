/**
 * Type Import Test
 * Simple test to verify all types can be imported correctly
 */

// Test importing from index
import {
  // Core types
  ChatMessage,
  ChatSession,
  DeckCard,
  Deck,
  DeckData,
  DeckAnalysis,
  
  // Azure types
  AzureConfig,
  StorageOptions,
  ServiceBusMessage,
  KeyVaultSecret,
  
  // UI/UX types
  ScrollingWebsiteState,
  DeckVisualization3D,
  DeckDigitizer,
  
  // Type guards
  isChatMessage,
  isDeckCard,
  isAzureConfig,
  
  // Constants
  DECK_FORMATS,
  CARD_RARITIES,
  AZURE_REGIONS,
  
  // Default values
  DEFAULT_QUERY_OPTIONS,
  DEFAULT_CHAT_OPTIONS
} from './index.js';

// Test importing directly from individual files
import type { 
  ChatCompletionRequest,
  DeckAnalysisRequest,
  ApiResponse 
} from './deckchatbot.js';

import type {
  AzureOpenAIConfig,
  CosmosDbOptions,
  DeckAnalysisMessage
} from './azure.js';

/**
 * Test function to verify types work correctly
 */
export function testTypes(): void {
  console.log('🧪 Testing TypeScript type definitions...');

  // Test ChatMessage
  const testMessage: ChatMessage = {
    sessionId: 'test-session',
    userId: 'test-user',
    role: 'user',
    content: 'Hello, world!',
    timestamp: new Date()
  };

  console.log('✅ ChatMessage type works:', isChatMessage(testMessage));

  // Test DeckCard
  const testCard: DeckCard = {
    name: 'Lightning Bolt',
    manaCost: '{R}',
    convertedManaCost: 1,
    type: 'Instant',
    rarity: 'common',
    set: 'LEA',
    colors: ['Red'],
    quantity: 4
  };

  console.log('✅ DeckCard type works:', isDeckCard(testCard));

  // Test AzureConfig
  const testAzureConfig: Partial<AzureConfig> = {
    subscriptionId: 'test-subscription',
    resourceGroupName: 'test-rg',
    region: 'East US'
  };

  console.log('✅ AzureConfig type works');

  // Test ScrollingWebsiteState
  const testScrollState: ScrollingWebsiteState = {
    currentSection: 'hero',
    scrollPosition: 0,
    isScrolling: false,
    animations: {
      fadeIn: true,
      slideUp: true,
      parallax: false
    },
    theme: 'dark',
    layout: 'desktop'
  };

  console.log('✅ ScrollingWebsiteState type works');

  // Test DeckVisualization3D
  const test3DVisualization: DeckVisualization3D = {
    enabled: true,
    viewMode: 'grid',
    cardRotation: { x: 0, y: 0, z: 0 },
    cameraPosition: { x: 0, y: 5, z: 10 },
    lighting: {
      ambient: 0.4,
      directional: 0.8,
      shadows: true
    },
    animations: {
      cardFlip: true,
      hoverEffects: true,
      transitionSpeed: 0.3
    }
  };

  console.log('✅ DeckVisualization3D type works');

  // Test DeckDigitizer
  const testDigitizer: DeckDigitizer = {
    isActive: false,
    mode: 'camera',
    confidence: 0.95,
    recognizedCards: [
      {
        name: 'Lightning Bolt',
        confidence: 0.98,
        quantity: 4,
        boundingBox: { x: 10, y: 10, width: 100, height: 140 }
      }
    ],
    processingStatus: 'idle',
    settings: {
      autoCorrect: true,
      multipleAngles: false,
      enhanceImage: true,
      batchProcessing: false
    }
  };

  console.log('✅ DeckDigitizer type works');

  // Test constants
  console.log('✅ DECK_FORMATS:', DECK_FORMATS.length, 'formats available');
  console.log('✅ CARD_RARITIES:', CARD_RARITIES.length, 'rarities available');
  console.log('✅ AZURE_REGIONS:', AZURE_REGIONS.length, 'regions available');

  // Test default values
  console.log('✅ DEFAULT_QUERY_OPTIONS:', DEFAULT_QUERY_OPTIONS);
  console.log('✅ DEFAULT_CHAT_OPTIONS:', DEFAULT_CHAT_OPTIONS);

  console.log('🎉 All type definitions are working correctly!');
}

/**
 * Test Azure Service Bus message types
 */
export function testServiceBusTypes(): void {
  console.log('🧪 Testing Azure Service Bus message types...');

  const testDeckAnalysisMessage: DeckAnalysisMessage = {
    messageId: 'test-msg-123',
    body: {
      deckId: 'deck-123',
      userId: 'user-456',
      deckList: '4 Lightning Bolt\n20 Mountain',
      format: 'Modern',
      analysisType: 'competitive',
      priority: 'normal',
      requestedAt: new Date()
    }
  };

  console.log('✅ DeckAnalysisMessage type works');

  const testNotificationMessage = {
    messageId: 'notif-123',
    body: {
      userId: 'user-456',
      type: 'deck_analysis_complete' as const,
      title: 'Deck Analysis Complete',
      message: 'Your deck analysis is ready!',
      channels: ['in_app', 'email'] as const,
      priority: 'normal' as const
    }
  };

  console.log('✅ NotificationMessage type works');
  console.log('🎉 All Azure Service Bus types are working correctly!');
}

// Export test functions for use in other files
export { testTypes as default };
