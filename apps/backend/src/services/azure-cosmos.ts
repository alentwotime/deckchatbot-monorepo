/**
 * Azure Cosmos DB Service
 * Provides chat message storage, session management, deck storage and search
 */

import { CosmosClient, Database, Container, ItemResponse, FeedResponse } from '@azure/cosmos';
import { azureConfig } from './azure-config.js';

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
    manaCurve: { [key: number]: number };
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

class AzureCosmosService {
  private static instance: AzureCosmosService;
  private client: CosmosClient;
  private database: Database;
  private containers: {
    chats: Container;
    sessions: Container;
    decks: Container;
  };
  private config: any;
  private initialized: boolean = false;

  private constructor() {
    this.config = azureConfig.getCosmosDbConfig();
    this.initializeClient();
  }

  public static getInstance(): AzureCosmosService {
    if (!AzureCosmosService.instance) {
      AzureCosmosService.instance = new AzureCosmosService();
    }
    return AzureCosmosService.instance;
  }

  /**
   * Initialize Cosmos DB client and containers
   */
  private async initializeClient(): Promise<void> {
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
    } catch (error) {
      console.error('❌ Failed to initialize Azure Cosmos DB:', error);
      throw error;
    }
  }

  /**
   * Initialize all required containers
   */
  private async initializeContainers(): Promise<void> {
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
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeClient();
    }
  }

  // ==================== CHAT MESSAGES ====================

  /**
   * Store a chat message
   */
  public async storeChatMessage(message: ChatMessage): Promise<ChatMessage> {
    await this.ensureInitialized();

    const messageWithId = {
      ...message,
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: message.timestamp || new Date(),
    };

    try {
      const { resource } = await this.containers.chats.items.create(messageWithId);
      return resource as ChatMessage;
    } catch (error) {
      console.error('Error storing chat message:', error);
      throw new Error(`Failed to store chat message: ${error.message}`);
    }
  }

  /**
   * Retrieve chat messages for a session
   */
  public async getChatMessages(
    sessionId: string,
    options: QueryOptions = {}
  ): Promise<ChatMessage[]> {
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

      return resources as ChatMessage[];
    } catch (error) {
      console.error('Error retrieving chat messages:', error);
      throw new Error(`Failed to retrieve chat messages: ${error.message}`);
    }
  }

  /**
   * Delete chat messages for a session
   */
  public async deleteChatMessages(sessionId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const messages = await this.getChatMessages(sessionId);
      
      for (const message of messages) {
        await this.containers.chats.item(message.id!, sessionId).delete();
      }
    } catch (error) {
      console.error('Error deleting chat messages:', error);
      throw new Error(`Failed to delete chat messages: ${error.message}`);
    }
  }

  // ==================== SESSIONS ====================

  /**
   * Create a new chat session
   */
  public async createSession(session: Omit<ChatSession, 'id'>): Promise<ChatSession> {
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
      return resource as ChatSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Get a session by ID
   */
  public async getSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    await this.ensureInitialized();

    try {
      const { resource } = await this.containers.sessions.item(sessionId, userId).read();
      return resource as ChatSession;
    } catch (error) {
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
  public async getUserSessions(
    userId: string,
    options: QueryOptions = {}
  ): Promise<ChatSession[]> {
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

      return resources as ChatSession[];
    } catch (error) {
      console.error('Error retrieving user sessions:', error);
      throw new Error(`Failed to retrieve user sessions: ${error.message}`);
    }
  }

  /**
   * Update a session
   */
  public async updateSession(sessionId: string, userId: string, updates: Partial<ChatSession>): Promise<ChatSession> {
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
      return resource as ChatSession;
    } catch (error) {
      console.error('Error updating session:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  /**
   * Delete a session and its messages
   */
  public async deleteSession(sessionId: string, userId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      // Delete all messages in the session
      await this.deleteChatMessages(sessionId);
      
      // Delete the session
      await this.containers.sessions.item(sessionId, userId).delete();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  // ==================== DECKS ====================

  /**
   * Store a deck
   */
  public async storeDeck(deck: Omit<DeckData, 'id'>): Promise<DeckData> {
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
      return resource as DeckData;
    } catch (error) {
      console.error('Error storing deck:', error);
      throw new Error(`Failed to store deck: ${error.message}`);
    }
  }

  /**
   * Get a deck by ID
   */
  public async getDeck(deckId: string, userId: string): Promise<DeckData | null> {
    await this.ensureInitialized();

    try {
      const { resource } = await this.containers.decks.item(deckId, userId).read();
      return resource as DeckData;
    } catch (error) {
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
  public async searchDecks(
    searchParams: {
      userId?: string;
      format?: string;
      tags?: string[];
      isPublic?: boolean;
      searchText?: string;
    },
    options: QueryOptions = {}
  ): Promise<DeckData[]> {
    await this.ensureInitialized();

    const { limit = 50, offset = 0, orderBy = 'updatedAt', orderDirection = 'DESC' } = options;
    
    let whereClause = 'WHERE 1=1';
    const parameters: any[] = [];

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

    parameters.push(
      { name: '@offset', value: offset },
      { name: '@limit', value: limit }
    );

    try {
      const { resources } = await this.containers.decks.items.query({
        query,
        parameters,
      }).fetchAll();

      return resources as DeckData[];
    } catch (error) {
      console.error('Error searching decks:', error);
      throw new Error(`Failed to search decks: ${error.message}`);
    }
  }

  /**
   * Update a deck
   */
  public async updateDeck(deckId: string, userId: string, updates: Partial<DeckData>): Promise<DeckData> {
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
      return resource as DeckData;
    } catch (error) {
      console.error('Error updating deck:', error);
      throw new Error(`Failed to update deck: ${error.message}`);
    }
  }

  /**
   * Delete a deck
   */
  public async deleteDeck(deckId: string, userId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.containers.decks.item(deckId, userId).delete();
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw new Error(`Failed to delete deck: ${error.message}`);
    }
  }

  /**
   * Get popular decks
   */
  public async getPopularDecks(format?: string, limit: number = 20): Promise<DeckData[]> {
    await this.ensureInitialized();

    let whereClause = 'WHERE c.isPublic = true';
    const parameters: any[] = [];

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

      return resources as DeckData[];
    } catch (error) {
      console.error('Error retrieving popular decks:', error);
      throw new Error(`Failed to retrieve popular decks: ${error.message}`);
    }
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{ status: string; configured: boolean; error?: string }> {
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
    } catch (error) {
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
  public async getStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalDecks: number;
    publicDecks: number;
  }> {
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
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw new Error(`Failed to get database stats: ${error.message}`);
    }
  }
}

// Export singleton instance
export const azureCosmos = AzureCosmosService.getInstance();
export default azureCosmos;
