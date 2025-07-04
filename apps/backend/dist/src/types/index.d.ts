/**
 * Type Definitions Index
 * Central export point for all TypeScript type definitions in DeckChatBot
 */
export * from './deckchatbot.js';
export * from './azure.js';
export * from './visual.js';
export type { ChatMessage, ChatSession, ChatContext, ChatCompletionRequest, ChatCompletionResponse, StreamingResponse, StreamingCallbacks } from './deckchatbot.js';
export type { DeckCard, Deck, DeckData, DeckAnalysis, DeckStats, DeckAnalysisRequest, DeckAnalysisResponse } from './deckchatbot.js';
export type { ScrollingWebsiteState, DeckVisualization3D, DeckDigitizer } from './deckchatbot.js';
export type { EmbeddingRequest, EmbeddingResponse, TokenUsage } from './deckchatbot.js';
export type { QueryOptions, SearchParams, ApiResponse, PaginatedResponse, AppError, ValidationError } from './deckchatbot.js';
export type { AzureConfig, AzureOpenAIConfig, CosmosDbOptions, KeyVaultOptions } from './azure.js';
export type { StorageOptions, UploadOptions, UploadResult, DownloadResult, SignedUrlOptions, BlobMetadata, ContainerStats } from './azure.js';
export type { ServiceBusMessage, DeckAnalysisMessage, NotificationMessage, ExportMessage, ImportMessage, UserActivityMessage, SystemEventMessage, ServiceBusOptions, MessageHandler } from './azure.js';
export type { KeyVaultSecret, KeyVaultKey, KeyVaultCertificate, SecretBundle } from './azure.js';
export type { AzureHealthCheck, AzureMetrics, AzureAlert, AzureResourceStatus } from './azure.js';
export type { ThreeDModelConfig, Vector3, Vector2, PointLight, SpotLight, AnimationTrack, Keyframe, Quaternion, PhysicsBody } from './visual.js';
export type { BlueprintSettings } from './visual.js';
export type { ImageProcessingOptions } from './visual.js';
export type { DrawingAnalysis, DetectedCard, DetectedText, DetectedShape, DetectedLine, DetectedAnnotation, DetectedSymbol, BoundingBox, LayoutRegion, ElementRelationship, RecognizedCardName, RecognizedQuantity, RecognizedCategory, RecognizedFormat, Suggestion, Correction, Alternative, Enhancement, ProcessingStep } from './visual.js';
export type { VisualQuality, RenderingEngine, ImageFormat, ModelFormat, ProcessingMethod, AnalysisType } from './visual.js';
export type { DeckBlueprint, UploadedImage, DeckVisualization, RecognizedCard, CardPosition, DeckBlueprintAnalysis, ImageAnalysisResult, VisualizationConfig, VisualizationSettings } from '../services/azure-computer-vision.js';
export type { OCRRequest, OCRResponse, TextRegion, TextLine, TextWord, CardRecognitionRequest, CardRecognitionResponse, ImageAnalysisRequest, DeckPhotoAnalysisRequest, DeckPhotoAnalysisResponse } from '../services/azure-computer-vision.js';
export type { DetectedObject, ExtractedText, DetectedFace, FaceLandmark, FaceAttributes, ColorAnalysis, ImageCategory, ImageTag } from '../services/azure-computer-vision.js';
export type { DeckFormat, CardRarity, AnalysisDepth, ExportFormat, ImportSource } from './deckchatbot.js';
export type { AzureRegion, AzureServiceTier, AzureEnvironment, AzureAuthMethod } from './azure.js';
/**
 * Type guard to check if an object is a ChatMessage
 */
export declare function isChatMessage(obj: any): obj is ChatMessage;
/**
 * Type guard to check if an object is a DeckCard
 */
export declare function isDeckCard(obj: any): obj is DeckCard;
/**
 * Type guard to check if an object is a Deck
 */
export declare function isDeck(obj: any): obj is Deck;
/**
 * Type guard to check if an object is an AzureConfig
 */
export declare function isAzureConfig(obj: any): obj is AzureConfig;
/**
 * Type guard to check if an object is a ServiceBusMessage
 */
export declare function isServiceBusMessage(obj: any): obj is ServiceBusMessage;
/**
 * Type guard to check if an object is an ApiResponse
 */
export declare function isApiResponse<T = any>(obj: any): obj is ApiResponse<T>;
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
/**
 * Available deck formats
 */
export declare const DECK_FORMATS: readonly ["Standard", "Modern", "Legacy", "Vintage", "Commander", "Pioneer", "Historic", "Pauper", "Limited"];
/**
 * Available card rarities
 */
export declare const CARD_RARITIES: readonly ["common", "uncommon", "rare", "mythic"];
/**
 * Available analysis depths
 */
export declare const ANALYSIS_DEPTHS: readonly ["basic", "detailed", "comprehensive"];
/**
 * Available export formats
 */
export declare const EXPORT_FORMATS: readonly ["json", "txt", "mtgo", "arena", "cockatrice"];
/**
 * Available Azure regions
 */
export declare const AZURE_REGIONS: readonly ["East US", "West US", "Central US", "North Europe", "West Europe", "Southeast Asia", "East Asia"];
/**
 * Available Azure service tiers
 */
export declare const AZURE_SERVICE_TIERS: readonly ["Free", "Basic", "Standard", "Premium"];
/**
 * Default query options
 */
export declare const DEFAULT_QUERY_OPTIONS: QueryOptions;
/**
 * Default chat completion request options
 */
export declare const DEFAULT_CHAT_OPTIONS: Partial<ChatCompletionRequest>;
/**
 * Default deck analysis request options
 */
export declare const DEFAULT_ANALYSIS_OPTIONS: Partial<DeckAnalysisRequest>;
//# sourceMappingURL=index.d.ts.map