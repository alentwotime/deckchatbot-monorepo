/**
 * Type Definitions Index
 * Central export point for all TypeScript type definitions in DeckChatBot
 */

// ==================== CORE APPLICATION TYPES ====================
export * from './deckchatbot.js';

// ==================== AZURE SERVICE TYPES ====================
export * from './azure.js';

// ==================== RE-EXPORTS FOR CONVENIENCE ====================

// Core Chat Types
export type {
  ChatMessage,
  ChatSession,
  ChatContext,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamingResponse,
  StreamingCallbacks
} from './deckchatbot.js';

// Core Deck Types
export type {
  DeckCard,
  Deck,
  DeckData,
  DeckAnalysis,
  DeckStats,
  DeckAnalysisRequest,
  DeckAnalysisResponse
} from './deckchatbot.js';

// UI/UX Types
export type {
  ScrollingWebsiteState,
  DeckVisualization3D,
  DeckDigitizer
} from './deckchatbot.js';

// OpenAI Types
export type {
  EmbeddingRequest,
  EmbeddingResponse,
  TokenUsage
} from './deckchatbot.js';

// Query and API Types
export type {
  QueryOptions,
  SearchParams,
  ApiResponse,
  PaginatedResponse,
  AppError,
  ValidationError
} from './deckchatbot.js';

// Azure Configuration Types
export type {
  AzureConfig,
  AzureOpenAIConfig,
  CosmosDbOptions,
  KeyVaultOptions
} from './azure.js';

// Azure Storage Types
export type {
  StorageOptions,
  UploadOptions,
  UploadResult,
  DownloadResult,
  SignedUrlOptions,
  BlobMetadata,
  ContainerStats
} from './azure.js';

// Azure Service Bus Types
export type {
  ServiceBusMessage,
  DeckAnalysisMessage,
  NotificationMessage,
  ExportMessage,
  ImportMessage,
  UserActivityMessage,
  SystemEventMessage,
  ServiceBusOptions,
  MessageHandler
} from './azure.js';

// Azure Key Vault Types
export type {
  KeyVaultSecret,
  KeyVaultKey,
  KeyVaultCertificate,
  SecretBundle
} from './azure.js';

// Azure Monitoring Types
export type {
  AzureHealthCheck,
  AzureMetrics,
  AzureAlert,
  AzureResourceStatus
} from './azure.js';

// ==================== TYPE UNIONS AND UTILITIES ====================

// Common format types
export type {
  DeckFormat,
  CardRarity,
  AnalysisDepth,
  ExportFormat,
  ImportSource
} from './deckchatbot.js';

// Azure specific types
export type {
  AzureRegion,
  AzureServiceTier,
  AzureEnvironment,
  AzureAuthMethod
} from './azure.js';

// ==================== TYPE GUARDS ====================

/**
 * Type guard to check if an object is a ChatMessage
 */
export function isChatMessage(obj: any): obj is ChatMessage {
  return obj && 
    typeof obj.sessionId === 'string' &&
    typeof obj.userId === 'string' &&
    ['system', 'user', 'assistant'].includes(obj.role) &&
    typeof obj.content === 'string';
}

/**
 * Type guard to check if an object is a DeckCard
 */
export function isDeckCard(obj: any): obj is DeckCard {
  return obj &&
    typeof obj.name === 'string' &&
    typeof obj.manaCost === 'string' &&
    typeof obj.convertedManaCost === 'number' &&
    typeof obj.type === 'string' &&
    Array.isArray(obj.colors) &&
    typeof obj.quantity === 'number';
}

/**
 * Type guard to check if an object is a Deck
 */
export function isDeck(obj: any): obj is Deck {
  return obj &&
    typeof obj.userId === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.format === 'string' &&
    Array.isArray(obj.tags) &&
    typeof obj.isPublic === 'boolean' &&
    Array.isArray(obj.cards) &&
    Array.isArray(obj.mainboard) &&
    Array.isArray(obj.sideboard);
}

/**
 * Type guard to check if an object is an AzureConfig
 */
export function isAzureConfig(obj: any): obj is AzureConfig {
  return obj &&
    obj.openai &&
    obj.cosmosDb &&
    obj.storage &&
    obj.identity &&
    typeof obj.subscriptionId === 'string' &&
    typeof obj.resourceGroupName === 'string' &&
    typeof obj.region === 'string';
}

/**
 * Type guard to check if an object is a ServiceBusMessage
 */
export function isServiceBusMessage(obj: any): obj is ServiceBusMessage {
  return obj &&
    typeof obj.messageId === 'string' &&
    obj.body !== undefined;
}

/**
 * Type guard to check if an object is an ApiResponse
 */
export function isApiResponse<T = any>(obj: any): obj is ApiResponse<T> {
  return obj &&
    typeof obj.success === 'boolean' &&
    (obj.data !== undefined || obj.error !== undefined);
}

// ==================== UTILITY TYPES ====================

/**
 * Extract the data type from an ApiResponse
 */
export type ExtractApiResponseData<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * Extract the body type from a ServiceBusMessage
 */
export type ExtractMessageBody<T> = T extends ServiceBusMessage ? T['body'] : never;

/**
 * Make all properties of a type optional except specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Make all properties of a type required except specified keys
 */
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>;

/**
 * Create a type with only the specified keys from another type
 */
export type PickRequired<T, K extends keyof T> = Required<Pick<T, K>>;

/**
 * Create a type that excludes null and undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Create a deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Create a deep required type
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// ==================== CONSTANTS ====================

/**
 * Available deck formats
 */
export const DECK_FORMATS = [
  'Standard',
  'Modern', 
  'Legacy',
  'Vintage',
  'Commander',
  'Pioneer',
  'Historic',
  'Pauper',
  'Limited'
] as const;

/**
 * Available card rarities
 */
export const CARD_RARITIES = [
  'common',
  'uncommon', 
  'rare',
  'mythic'
] as const;

/**
 * Available analysis depths
 */
export const ANALYSIS_DEPTHS = [
  'basic',
  'detailed',
  'comprehensive'
] as const;

/**
 * Available export formats
 */
export const EXPORT_FORMATS = [
  'json',
  'txt',
  'mtgo',
  'arena',
  'cockatrice'
] as const;

/**
 * Available Azure regions
 */
export const AZURE_REGIONS = [
  'East US',
  'West US',
  'Central US',
  'North Europe',
  'West Europe',
  'Southeast Asia',
  'East Asia'
] as const;

/**
 * Available Azure service tiers
 */
export const AZURE_SERVICE_TIERS = [
  'Free',
  'Basic',
  'Standard',
  'Premium'
] as const;

// ==================== DEFAULT VALUES ====================

/**
 * Default query options
 */
export const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  limit: 50,
  offset: 0,
  orderBy: 'createdAt',
  orderDirection: 'DESC',
  includeMetadata: false
};

/**
 * Default chat completion request options
 */
export const DEFAULT_CHAT_OPTIONS: Partial<ChatCompletionRequest> = {
  maxTokens: 1000,
  temperature: 0.7,
  stream: false
};

/**
 * Default deck analysis request options
 */
export const DEFAULT_ANALYSIS_OPTIONS: Partial<DeckAnalysisRequest> = {
  analysisType: 'comprehensive',
  includeAlternatives: true,
  includeSideboard: true
};
