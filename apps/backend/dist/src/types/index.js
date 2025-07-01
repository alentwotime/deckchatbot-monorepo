/**
 * Type Definitions Index
 * Central export point for all TypeScript type definitions in DeckChatBot
 */
// ==================== CORE APPLICATION TYPES ====================
export * from './deckchatbot.js';
// ==================== AZURE SERVICE TYPES ====================
export * from './azure.js';
// ==================== VISUAL FEATURE TYPES ====================
export * from './visual.js';
// ==================== TYPE GUARDS ====================
/**
 * Type guard to check if an object is a ChatMessage
 */
export function isChatMessage(obj) {
    return obj &&
        typeof obj.sessionId === 'string' &&
        typeof obj.userId === 'string' &&
        ['system', 'user', 'assistant'].includes(obj.role) &&
        typeof obj.content === 'string';
}
/**
 * Type guard to check if an object is a DeckCard
 */
export function isDeckCard(obj) {
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
export function isDeck(obj) {
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
export function isAzureConfig(obj) {
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
export function isServiceBusMessage(obj) {
    return obj &&
        typeof obj.messageId === 'string' &&
        obj.body !== undefined;
}
/**
 * Type guard to check if an object is an ApiResponse
 */
export function isApiResponse(obj) {
    return obj &&
        typeof obj.success === 'boolean' &&
        (obj.data !== undefined || obj.error !== undefined);
}
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
];
/**
 * Available card rarities
 */
export const CARD_RARITIES = [
    'common',
    'uncommon',
    'rare',
    'mythic'
];
/**
 * Available analysis depths
 */
export const ANALYSIS_DEPTHS = [
    'basic',
    'detailed',
    'comprehensive'
];
/**
 * Available export formats
 */
export const EXPORT_FORMATS = [
    'json',
    'txt',
    'mtgo',
    'arena',
    'cockatrice'
];
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
];
/**
 * Available Azure service tiers
 */
export const AZURE_SERVICE_TIERS = [
    'Free',
    'Basic',
    'Standard',
    'Premium'
];
// ==================== DEFAULT VALUES ====================
/**
 * Default query options
 */
export const DEFAULT_QUERY_OPTIONS = {
    limit: 50,
    offset: 0,
    orderBy: 'createdAt',
    orderDirection: 'DESC',
    includeMetadata: false
};
/**
 * Default chat completion request options
 */
export const DEFAULT_CHAT_OPTIONS = {
    maxTokens: 1000,
    temperature: 0.7,
    stream: false
};
/**
 * Default deck analysis request options
 */
export const DEFAULT_ANALYSIS_OPTIONS = {
    analysisType: 'comprehensive',
    includeAlternatives: true,
    includeSideboard: true
};
//# sourceMappingURL=index.js.map