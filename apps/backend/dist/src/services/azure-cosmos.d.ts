/**
 * Azure Cosmos DB Service
 * Provides chat message storage, session management, deck storage and search
 */
export interface ChatMessage {
    id?: string;
    sessionId: string;
    userId: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: {
        tokens?: number;
        model?: string;
        temperature?: number;
    };
}
export interface ChatSession {
    id?: string;
    userId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
    isActive: boolean;
    metadata?: {
        format?: string;
        deckName?: string;
        tags?: string[];
    };
}
export interface DeckData {
    id?: string;
    userId: string;
    name: string;
    format: string;
    deckList: string;
    description?: string;
    tags: string[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    analysis?: {
        competitiveRating?: number;
        colors: string[];
        manaCurve: {
            [key: number]: number;
        };
        suggestions: string[];
        strengths: string[];
        weaknesses: string[];
    };
    stats?: {
        views: number;
        likes: number;
        copies: number;
    };
}
export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}
declare class AzureCosmosService {
    private static instance;
    private client;
    private database;
    private containers;
    private config;
    private initialized;
    private constructor();
    static getInstance(): AzureCosmosService;
    /**
     * Initialize Cosmos DB client and containers
     */
    private initializeClient;
    /**
     * Initialize all required containers
     */
    private initializeContainers;
    /**
     * Ensure the service is initialized
     */
    private ensureInitialized;
    /**
     * Store a chat message
     */
    storeChatMessage(message: ChatMessage): Promise<ChatMessage>;
    /**
     * Retrieve chat messages for a session
     */
    getChatMessages(sessionId: string, options?: QueryOptions): Promise<ChatMessage[]>;
    /**
     * Delete chat messages for a session
     */
    deleteChatMessages(sessionId: string): Promise<void>;
    /**
     * Create a new chat session
     */
    createSession(session: Omit<ChatSession, 'id'>): Promise<ChatSession>;
    /**
     * Get a session by ID
     */
    getSession(sessionId: string, userId: string): Promise<ChatSession | null>;
    /**
     * Get sessions for a user
     */
    getUserSessions(userId: string, options?: QueryOptions): Promise<ChatSession[]>;
    /**
     * Update a session
     */
    updateSession(sessionId: string, userId: string, updates: Partial<ChatSession>): Promise<ChatSession>;
    /**
     * Delete a session and its messages
     */
    deleteSession(sessionId: string, userId: string): Promise<void>;
    /**
     * Store a deck
     */
    storeDeck(deck: Omit<DeckData, 'id'>): Promise<DeckData>;
    /**
     * Get a deck by ID
     */
    getDeck(deckId: string, userId: string): Promise<DeckData | null>;
    /**
     * Search decks
     */
    searchDecks(searchParams: {
        userId?: string;
        format?: string;
        tags?: string[];
        isPublic?: boolean;
        searchText?: string;
    }, options?: QueryOptions): Promise<DeckData[]>;
    /**
     * Update a deck
     */
    updateDeck(deckId: string, userId: string, updates: Partial<DeckData>): Promise<DeckData>;
    /**
     * Delete a deck
     */
    deleteDeck(deckId: string, userId: string): Promise<void>;
    /**
     * Get popular decks
     */
    getPopularDecks(format?: string, limit?: number): Promise<DeckData[]>;
    /**
     * Health check for the service
     */
    healthCheck(): Promise<{
        status: string;
        configured: boolean;
        error?: string;
    }>;
    /**
     * Get database statistics
     */
    getStats(): Promise<{
        totalSessions: number;
        totalMessages: number;
        totalDecks: number;
        publicDecks: number;
    }>;
}
export declare const azureCosmos: AzureCosmosService;
export default azureCosmos;
//# sourceMappingURL=azure-cosmos.d.ts.map