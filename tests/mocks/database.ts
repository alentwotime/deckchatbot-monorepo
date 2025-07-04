import { vi } from 'vitest'

// Mock database connection
export const mockDatabase = {
  connect: vi.fn().mockResolvedValue(true),
  disconnect: vi.fn().mockResolvedValue(true),
  isConnected: vi.fn().mockReturnValue(true),
  
  // Collection/Table operations
  collection: vi.fn((name: string) => ({
    find: vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
      limit: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis()
    }),
    findOne: vi.fn().mockResolvedValue(null),
    insertOne: vi.fn().mockResolvedValue({
      insertedId: 'mock-id',
      acknowledged: true
    }),
    insertMany: vi.fn().mockResolvedValue({
      insertedIds: ['mock-id-1', 'mock-id-2'],
      acknowledged: true
    }),
    updateOne: vi.fn().mockResolvedValue({
      modifiedCount: 1,
      acknowledged: true
    }),
    updateMany: vi.fn().mockResolvedValue({
      modifiedCount: 2,
      acknowledged: true
    }),
    deleteOne: vi.fn().mockResolvedValue({
      deletedCount: 1,
      acknowledged: true
    }),
    deleteMany: vi.fn().mockResolvedValue({
      deletedCount: 2,
      acknowledged: true
    }),
    countDocuments: vi.fn().mockResolvedValue(0),
    createIndex: vi.fn().mockResolvedValue('mock-index-name')
  }))
}

// Mock specific collections for the deck chatbot
export const mockCollections = {
  users: {
    findById: vi.fn().mockResolvedValue({
      _id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date()
    }),
    create: vi.fn().mockResolvedValue({
      _id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date()
    }),
    updateById: vi.fn().mockResolvedValue({
      _id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      updatedAt: new Date()
    }),
    deleteById: vi.fn().mockResolvedValue({ deletedCount: 1 })
  },
  
  decks: {
    findById: vi.fn().mockResolvedValue({
      _id: 'deck-123',
      name: 'Test Deck',
      format: 'Standard',
      cards: [],
      userId: 'user-123',
      createdAt: new Date()
    }),
    findByUserId: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({
      _id: 'deck-123',
      name: 'Test Deck',
      format: 'Standard',
      cards: [],
      userId: 'user-123',
      createdAt: new Date()
    }),
    updateById: vi.fn().mockResolvedValue({
      _id: 'deck-123',
      name: 'Updated Deck',
      format: 'Standard',
      cards: [],
      userId: 'user-123',
      updatedAt: new Date()
    }),
    deleteById: vi.fn().mockResolvedValue({ deletedCount: 1 })
  },
  
  cards: {
    findById: vi.fn().mockResolvedValue({
      _id: 'card-123',
      name: 'Lightning Bolt',
      manaCost: '{R}',
      type: 'Instant',
      text: 'Lightning Bolt deals 3 damage to any target.',
      power: null,
      toughness: null,
      rarity: 'Common'
    }),
    findByName: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({
      _id: 'card-123',
      name: 'Lightning Bolt',
      manaCost: '{R}',
      type: 'Instant',
      text: 'Lightning Bolt deals 3 damage to any target.',
      power: null,
      toughness: null,
      rarity: 'Common'
    })
  },
  
  chatSessions: {
    findById: vi.fn().mockResolvedValue({
      _id: 'session-123',
      userId: 'user-123',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    findByUserId: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({
      _id: 'session-123',
      userId: 'user-123',
      messages: [],
      createdAt: new Date()
    }),
    addMessage: vi.fn().mockResolvedValue({
      _id: 'session-123',
      userId: 'user-123',
      messages: [{
        id: 'msg-123',
        content: 'Test message',
        role: 'user',
        timestamp: new Date()
      }],
      updatedAt: new Date()
    }),
    deleteById: vi.fn().mockResolvedValue({ deletedCount: 1 })
  }
}

// Mock transaction support
export const mockTransaction = {
  startSession: vi.fn().mockResolvedValue({
    startTransaction: vi.fn(),
    commitTransaction: vi.fn().mockResolvedValue(true),
    abortTransaction: vi.fn().mockResolvedValue(true),
    endSession: vi.fn().mockResolvedValue(true)
  })
}

// Mock database utilities
export const mockDbUtils = {
  validateObjectId: vi.fn().mockReturnValue(true),
  generateObjectId: vi.fn().mockReturnValue('mock-object-id'),
  sanitizeInput: vi.fn().mockImplementation((input: any) => input),
  buildQuery: vi.fn().mockReturnValue({}),
  buildSort: vi.fn().mockReturnValue({}),
  buildProjection: vi.fn().mockReturnValue({})
}

// Export all database mocks
export const databaseMocks = {
  database: mockDatabase,
  collections: mockCollections,
  transaction: mockTransaction,
  utils: mockDbUtils
}

// Helper function to reset all database mocks
export const resetDatabaseMocks = () => {
  // Reset main database mock
  Object.values(mockDatabase).forEach(fn => {
    if (vi.isMockFunction(fn)) {
      fn.mockClear()
    }
  })
  
  // Reset collection mocks
  Object.values(mockCollections).forEach(collection => {
    Object.values(collection).forEach(fn => {
      if (vi.isMockFunction(fn)) {
        fn.mockClear()
      }
    })
  })
  
  // Reset transaction mocks
  Object.values(mockTransaction).forEach(fn => {
    if (vi.isMockFunction(fn)) {
      fn.mockClear()
    }
  })
  
  // Reset utility mocks
  Object.values(mockDbUtils).forEach(fn => {
    if (vi.isMockFunction(fn)) {
      fn.mockClear()
    }
  })
}

// Helper function to setup test data
export const setupTestData = {
  createUser: (overrides = {}) => ({
    _id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date(),
    ...overrides
  }),
  
  createDeck: (overrides = {}) => ({
    _id: 'deck-123',
    name: 'Test Deck',
    format: 'Standard',
    cards: [],
    userId: 'user-123',
    createdAt: new Date(),
    ...overrides
  }),
  
  createCard: (overrides = {}) => ({
    _id: 'card-123',
    name: 'Lightning Bolt',
    manaCost: '{R}',
    type: 'Instant',
    text: 'Lightning Bolt deals 3 damage to any target.',
    power: null,
    toughness: null,
    rarity: 'Common',
    ...overrides
  }),
  
  createChatSession: (overrides = {}) => ({
    _id: 'session-123',
    userId: 'user-123',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })
}
