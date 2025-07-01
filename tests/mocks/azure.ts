import { vi } from 'vitest'

// Mock Azure Identity
export const mockDefaultAzureCredential = {
  getToken: vi.fn().mockResolvedValue({
    token: 'mock-token',
    expiresOnTimestamp: Date.now() + 3600000
  })
}

vi.mock('@azure/identity', () => ({
  DefaultAzureCredential: vi.fn(() => mockDefaultAzureCredential),
  ClientSecretCredential: vi.fn(() => mockDefaultAzureCredential),
  ManagedIdentityCredential: vi.fn(() => mockDefaultAzureCredential)
}))

// Mock Azure OpenAI
export const mockOpenAIClient = {
  getChatCompletions: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: 'Mock AI response',
        role: 'assistant'
      }
    }]
  }),
  getCompletions: vi.fn().mockResolvedValue({
    choices: [{
      text: 'Mock completion response'
    }]
  })
}

vi.mock('@azure/openai', () => ({
  OpenAIClient: vi.fn(() => mockOpenAIClient),
  AzureKeyCredential: vi.fn()
}))

// Mock Azure Cosmos DB
export const mockCosmosClient = {
  database: vi.fn(() => ({
    container: vi.fn(() => ({
      items: {
        create: vi.fn().mockResolvedValue({
          resource: { id: 'mock-id' },
          statusCode: 201
        }),
        query: vi.fn(() => ({
          fetchAll: vi.fn().mockResolvedValue({
            resources: [],
            requestCharge: 1
          })
        })),
        upsert: vi.fn().mockResolvedValue({
          resource: { id: 'mock-id' },
          statusCode: 200
        })
      },
      item: vi.fn(() => ({
        read: vi.fn().mockResolvedValue({
          resource: { id: 'mock-id' },
          statusCode: 200
        }),
        replace: vi.fn().mockResolvedValue({
          resource: { id: 'mock-id' },
          statusCode: 200
        }),
        delete: vi.fn().mockResolvedValue({
          statusCode: 204
        })
      }))
    }))
  }))
}

vi.mock('@azure/cosmos', () => ({
  CosmosClient: vi.fn(() => mockCosmosClient)
}))

// Mock Azure Storage Blob
export const mockBlobServiceClient = {
  getContainerClient: vi.fn(() => ({
    getBlobClient: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({
        requestId: 'mock-request-id'
      }),
      download: vi.fn().mockResolvedValue({
        readableStreamBody: 'mock-stream'
      }),
      delete: vi.fn().mockResolvedValue({
        requestId: 'mock-request-id'
      }),
      exists: vi.fn().mockResolvedValue(true)
    })),
    createIfNotExists: vi.fn().mockResolvedValue({
      succeeded: true
    })
  }))
}

vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: vi.fn(() => mockBlobServiceClient)
}))

// Mock Azure Key Vault
export const mockSecretClient = {
  getSecret: vi.fn().mockResolvedValue({
    value: 'mock-secret-value',
    name: 'mock-secret'
  }),
  setSecret: vi.fn().mockResolvedValue({
    name: 'mock-secret',
    value: 'mock-secret-value'
  })
}

vi.mock('@azure/keyvault-secrets', () => ({
  SecretClient: vi.fn(() => mockSecretClient)
}))

// Export all mocks for easy access in tests
export const azureMocks = {
  credential: mockDefaultAzureCredential,
  openai: mockOpenAIClient,
  cosmos: mockCosmosClient,
  blob: mockBlobServiceClient,
  keyVault: mockSecretClient
}

// Helper function to reset all Azure mocks
export const resetAzureMocks = () => {
  Object.values(azureMocks).forEach(mock => {
    if (typeof mock === 'object' && mock !== null) {
      Object.values(mock).forEach(fn => {
        if (vi.isMockFunction(fn)) {
          fn.mockClear()
        }
      })
    }
  })
}
