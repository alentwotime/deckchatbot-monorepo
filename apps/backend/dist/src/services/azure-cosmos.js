/**
 * Azure Cosmos DB Service
 * Provides chat message storage, session management, deck storage and search
 */
import { CosmosClient } from '@azure/cosmos';
import { azureConfig } from './azure-config.js';
class AzureCosmosService {
    static instance;
    client;
    database;
    containers;
    config;
    initialized = false;
    constructor() {
        this.config = azureConfig.getCosmosDbConfig();
        this.initializeClient();
    }
    static getInstance() {
        if (!AzureCosmosService.instance) {
            AzureCosmosService.instance = new AzureCosmosService();
        }
        return AzureCosmosService.instance;
    }
    /**
     * Initialize Cosmos DB client and containers
     */
    async initializeClient() {
        if (!this.config.endpoint || !this.config.key) {
            console.warn('⚠️  Azure Cosmos DB not configured. Database features will be unavailable.');
            return;
        }
        try {
            this.client = new CosmosClient({
                endpoint: this.config.endpoint,
                key: this.config.key,
            });
            // Create database if it doesn't exist
            const { database } = await this.client.databases.createIfNotExists({
                id: this.config.databaseId,
            });
            this.database = database;
            // Initialize containers
            await this.initializeContainers();
            this.initialized = true;
            console.log('✅ Azure Cosmos DB initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize Azure Cosmos DB:', error);
            throw error;
        }
    }
    /**
     * Initialize all required containers
     */
    async initializeContainers() {
        // Chat messages container
        const { container: chatsContainer } = await this.database.containers.createIfNotExists({
            id: this.config.containers.chats,
            partitionKey: { paths: ['/sessionId'] },
            indexingPolicy: {
                indexingMode: 'consistent',
                automatic: true,
                includedPaths: [
                    { path: '/*' }
                ],
                excludedPaths: [
                    { path: '/content/*' }
                ]
            }
        });
        // Sessions container
        const { container: sessionsContainer } = await this.database.containers.createIfNotExists({
            id: this.config.containers.sessions,
            partitionKey: { paths: ['/userId'] },
            indexingPolicy: {
                indexingMode: 'consistent',
                automatic: true,
                includedPaths: [
                    { path: '/*' }
                ]
            }
        });
        // Decks container
        const { container: decksContainer } = await this.database.containers.createIfNotExists({
            id: this.config.containers.decks,
            partitionKey: { paths: ['/userId'] },
            indexingPolicy: {
                indexingMode: 'consistent',
                automatic: true,
                includedPaths: [
                    { path: '/*' }
                ],
                excludedPaths: [
                    { path: '/deckList/*' }
                ]
            }
        });
        this.containers = {
            chats: chatsContainer,
            sessions: sessionsContainer,
            decks: decksContainer,
        };
    }
    /**
     * Ensure the service is initialized
     */
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initializeClient();
        }
    }
    // ==================== CHAT MESSAGES ====================
    /**
     * Store a chat message
     */
    async storeChatMessage(message) {
        await this.ensureInitialized();
        const messageWithId = {
            ...message,
            id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: message.timestamp || new Date(),
        };
        try {
            const { resource } = await this.containers.chats.items.create(messageWithId);
            return resource;
        }
        catch (error) {
            console.error('Error storing chat message:', error);
            throw new Error(`Failed to store chat message: ${error.message}`);
        }
    }
    /**
     * Retrieve chat messages for a session
     */
    async getChatMessages(sessionId, options = {}) {
        await this.ensureInitialized();
        const { limit = 100, offset = 0, orderBy = 'timestamp', orderDirection = 'ASC' } = options;
        const query = `
      SELECT * FROM c 
      WHERE c.sessionId = @sessionId 
      ORDER BY c.${orderBy} ${orderDirection}
      OFFSET @offset LIMIT @limit
    `;
        try {
            const { resources } = await this.containers.chats.items.query({
                query,
                parameters: [
                    { name: '@sessionId', value: sessionId },
                    { name: '@offset', value: offset },
                    { name: '@limit', value: limit },
                ],
            }).fetchAll();
            return resources;
        }
        catch (error) {
            console.error('Error retrieving chat messages:', error);
            throw new Error(`Failed to retrieve chat messages: ${error.message}`);
        }
    }
    /**
     * Delete chat messages for a session
     */
    async deleteChatMessages(sessionId) {
        await this.ensureInitialized();
        try {
            const messages = await this.getChatMessages(sessionId);
            for (const message of messages) {
                await this.containers.chats.item(message.id, sessionId).delete();
            }
        }
        catch (error) {
            console.error('Error deleting chat messages:', error);
            throw new Error(`Failed to delete chat messages: ${error.message}`);
        }
    }
    // ==================== SESSIONS ====================
    /**
     * Create a new chat session
     */
    async createSession(session) {
        await this.ensureInitialized();
        const sessionWithId = {
            ...session,
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            messageCount: 0,
            isActive: true,
        };
        try {
            const { resource } = await this.containers.sessions.items.create(sessionWithId);
            return resource;
        }
        catch (error) {
            console.error('Error creating session:', error);
            throw new Error(`Failed to create session: ${error.message}`);
        }
    }
    /**
     * Get a session by ID
     */
    async getSession(sessionId, userId) {
        await this.ensureInitialized();
        try {
            const { resource } = await this.containers.sessions.item(sessionId, userId).read();
            return resource;
        }
        catch (error) {
            if (error.code === 404) {
                return null;
            }
            console.error('Error retrieving session:', error);
            throw new Error(`Failed to retrieve session: ${error.message}`);
        }
    }
    /**
     * Get sessions for a user
     */
    async getUserSessions(userId, options = {}) {
        await this.ensureInitialized();
        const { limit = 50, offset = 0, orderBy = 'updatedAt', orderDirection = 'DESC' } = options;
        const query = `
      SELECT * FROM c 
      WHERE c.userId = @userId 
      ORDER BY c.${orderBy} ${orderDirection}
      OFFSET @offset LIMIT @limit
    `;
        try {
            const { resources } = await this.containers.sessions.items.query({
                query,
                parameters: [
                    { name: '@userId', value: userId },
                    { name: '@offset', value: offset },
                    { name: '@limit', value: limit },
                ],
            }).fetchAll();
            return resources;
        }
        catch (error) {
            console.error('Error retrieving user sessions:', error);
            throw new Error(`Failed to retrieve user sessions: ${error.message}`);
        }
    }
    /**
     * Update a session
     */
    async updateSession(sessionId, userId, updates) {
        await this.ensureInitialized();
        try {
            const session = await this.getSession(sessionId, userId);
            if (!session) {
                throw new Error('Session not found');
            }
            const updatedSession = {
                ...session,
                ...updates,
                updatedAt: new Date(),
            };
            const { resource } = await this.containers.sessions.item(sessionId, userId).replace(updatedSession);
            return resource;
        }
        catch (error) {
            console.error('Error updating session:', error);
            throw new Error(`Failed to update session: ${error.message}`);
        }
    }
    /**
     * Delete a session and its messages
     */
    async deleteSession(sessionId, userId) {
        await this.ensureInitialized();
        try {
            // Delete all messages in the session
            await this.deleteChatMessages(sessionId);
            // Delete the session
            await this.containers.sessions.item(sessionId, userId).delete();
        }
        catch (error) {
            console.error('Error deleting session:', error);
            throw new Error(`Failed to delete session: ${error.message}`);
        }
    }
    // ==================== DECKS ====================
    /**
     * Store a deck
     */
    async storeDeck(deck) {
        await this.ensureInitialized();
        const deckWithId = {
            ...deck,
            id: `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            stats: {
                views: 0,
                likes: 0,
                copies: 0,
                ...deck.stats,
            },
        };
        try {
            const { resource } = await this.containers.decks.items.create(deckWithId);
            return resource;
        }
        catch (error) {
            console.error('Error storing deck:', error);
            throw new Error(`Failed to store deck: ${error.message}`);
        }
    }
    /**
     * Get a deck by ID
     */
    async getDeck(deckId, userId) {
        await this.ensureInitialized();
        try {
            const { resource } = await this.containers.decks.item(deckId, userId).read();
            return resource;
        }
        catch (error) {
            if (error.code === 404) {
                return null;
            }
            console.error('Error retrieving deck:', error);
            throw new Error(`Failed to retrieve deck: ${error.message}`);
        }
    }
    /**
     * Search decks
     */
    async searchDecks(searchParams, options = {}) {
        await this.ensureInitialized();
        const { limit = 50, offset = 0, orderBy = 'updatedAt', orderDirection = 'DESC' } = options;
        let whereClause = 'WHERE 1=1';
        const parameters = [];
        if (searchParams.userId) {
            whereClause += ' AND c.userId = @userId';
            parameters.push({ name: '@userId', value: searchParams.userId });
        }
        if (searchParams.format) {
            whereClause += ' AND c.format = @format';
            parameters.push({ name: '@format', value: searchParams.format });
        }
        if (searchParams.isPublic !== undefined) {
            whereClause += ' AND c.isPublic = @isPublic';
            parameters.push({ name: '@isPublic', value: searchParams.isPublic });
        }
        if (searchParams.tags && searchParams.tags.length > 0) {
            whereClause += ' AND ARRAY_CONTAINS(c.tags, @tag)';
            parameters.push({ name: '@tag', value: searchParams.tags[0] }); // Simplified for first tag
        }
        if (searchParams.searchText) {
            whereClause += ' AND (CONTAINS(c.name, @searchText) OR CONTAINS(c.description, @searchText))';
            parameters.push({ name: '@searchText', value: searchParams.searchText });
        }
        const query = `
      SELECT * FROM c 
      ${whereClause}
      ORDER BY c.${orderBy} ${orderDirection}
      OFFSET @offset LIMIT @limit
    `;
        parameters.push({ name: '@offset', value: offset }, { name: '@limit', value: limit });
        try {
            const { resources } = await this.containers.decks.items.query({
                query,
                parameters,
            }).fetchAll();
            return resources;
        }
        catch (error) {
            console.error('Error searching decks:', error);
            throw new Error(`Failed to search decks: ${error.message}`);
        }
    }
    /**
     * Update a deck
     */
    async updateDeck(deckId, userId, updates) {
        await this.ensureInitialized();
        try {
            const deck = await this.getDeck(deckId, userId);
            if (!deck) {
                throw new Error('Deck not found');
            }
            const updatedDeck = {
                ...deck,
                ...updates,
                updatedAt: new Date(),
            };
            const { resource } = await this.containers.decks.item(deckId, userId).replace(updatedDeck);
            return resource;
        }
        catch (error) {
            console.error('Error updating deck:', error);
            throw new Error(`Failed to update deck: ${error.message}`);
        }
    }
    /**
     * Delete a deck
     */
    async deleteDeck(deckId, userId) {
        await this.ensureInitialized();
        try {
            await this.containers.decks.item(deckId, userId).delete();
        }
        catch (error) {
            console.error('Error deleting deck:', error);
            throw new Error(`Failed to delete deck: ${error.message}`);
        }
    }
    /**
     * Get popular decks
     */
    async getPopularDecks(format, limit = 20) {
        await this.ensureInitialized();
        let whereClause = 'WHERE c.isPublic = true';
        const parameters = [];
        if (format) {
            whereClause += ' AND c.format = @format';
            parameters.push({ name: '@format', value: format });
        }
        const query = `
      SELECT * FROM c 
      ${whereClause}
      ORDER BY c.stats.likes DESC, c.stats.views DESC
      OFFSET 0 LIMIT @limit
    `;
        parameters.push({ name: '@limit', value: limit });
        try {
            const { resources } = await this.containers.decks.items.query({
                query,
                parameters,
            }).fetchAll();
            return resources;
        }
        catch (error) {
            console.error('Error retrieving popular decks:', error);
            throw new Error(`Failed to retrieve popular decks: ${error.message}`);
        }
    }
    // ==================== HEALTH CHECK ====================
    /**
     * Health check for the service
     */
    async healthCheck() {
        try {
            if (!this.config.endpoint || !this.config.key) {
                return {
                    status: 'unhealthy',
                    configured: false,
                    error: 'Azure Cosmos DB not configured'
                };
            }
            await this.ensureInitialized();
            // Test database connectivity
            await this.database.read();
            return {
                status: 'healthy',
                configured: true
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                configured: true,
                error: error.message
            };
        }
    }
    /**
     * Get database statistics
     */
    async getStats() {
        await this.ensureInitialized();
        try {
            const [sessionsCount, messagesCount, decksCount, publicDecksCount] = await Promise.all([
                this.containers.sessions.items.query('SELECT VALUE COUNT(1) FROM c').fetchAll(),
                this.containers.chats.items.query('SELECT VALUE COUNT(1) FROM c').fetchAll(),
                this.containers.decks.items.query('SELECT VALUE COUNT(1) FROM c').fetchAll(),
                this.containers.decks.items.query('SELECT VALUE COUNT(1) FROM c WHERE c.isPublic = true').fetchAll(),
            ]);
            return {
                totalSessions: sessionsCount.resources[0] || 0,
                totalMessages: messagesCount.resources[0] || 0,
                totalDecks: decksCount.resources[0] || 0,
                publicDecks: publicDecksCount.resources[0] || 0,
            };
        }
        catch (error) {
            console.error('Error getting database stats:', error);
            throw new Error(`Failed to get database stats: ${error.message}`);
        }
    }
}
// Export singleton instance
export const azureCosmos = AzureCosmosService.getInstance();
export default azureCosmos;
//# sourceMappingURL=azure-cosmos.js.map