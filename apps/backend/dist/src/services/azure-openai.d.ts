/**
 * Azure OpenAI Service Integration
 * Provides chat completion, streaming responses, embeddings, and deck analysis
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp?: Date;
}
export interface ChatCompletionRequest {
    messages: ChatMessage[];
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    userId?: string;
    sessionId?: string;
}
export interface ChatCompletionResponse {
    id: string;
    content: string;
    role: 'assistant';
    finishReason: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    timestamp: Date;
}
export interface EmbeddingRequest {
    text: string;
    model?: string;
}
export interface EmbeddingResponse {
    embedding: number[];
    usage: {
        promptTokens: number;
        totalTokens: number;
    };
}
export interface DeckAnalysisRequest {
    deckList: string;
    format?: string;
    analysisType?: 'competitive' | 'casual' | 'budget' | 'meta';
}
export interface DeckAnalysisResponse {
    analysis: string;
    suggestions: string[];
    strengths: string[];
    weaknesses: string[];
    manaBase: {
        colors: string[];
        curve: {
            [key: number]: number;
        };
        recommendations: string[];
    };
    sideboard?: string[];
    competitiveRating?: number;
}
declare class AzureOpenAIService {
    private static instance;
    private openai;
    private config;
    private readonly MTG_SYSTEM_PROMPT;
    private constructor();
    static getInstance(): AzureOpenAIService;
    /**
     * Initialize OpenAI client with Azure configuration
     */
    private initializeOpenAI;
    /**
     * Generate chat completion
     */
    createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    /**
     * Generate streaming chat completion
     */
    createStreamingChatCompletion(request: ChatCompletionRequest, onChunk: (chunk: string) => void, onComplete: (response: ChatCompletionResponse) => void, onError: (error: Error) => void): Promise<void>;
    /**
     * Generate embeddings
     */
    createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    /**
     * Analyze Magic: The Gathering deck
     */
    analyzeDeck(request: DeckAnalysisRequest): Promise<DeckAnalysisResponse>;
    /**
     * Analyze mana base from deck list
     */
    private analyzeManaBase;
    /**
     * Extract suggestions from analysis text
     */
    private extractSuggestions;
    /**
     * Extract strengths from analysis text
     */
    private extractStrengths;
    /**
     * Extract weaknesses from analysis text
     */
    private extractWeaknesses;
    /**
     * Calculate competitive rating (simplified)
     */
    private calculateCompetitiveRating;
    /**
     * Health check for the service
     */
    healthCheck(): Promise<{
        status: string;
        configured: boolean;
        error?: string;
    }>;
}
export declare const azureOpenAI: AzureOpenAIService;
export default azureOpenAI;
//# sourceMappingURL=azure-openai.d.ts.map