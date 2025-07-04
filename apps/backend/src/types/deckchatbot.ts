/**
 * Core Application Types for DeckChatBot
 * Comprehensive TypeScript type definitions for the main application functionality
 */

// ==================== CHAT TYPES ====================

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
    deckId?: string;
    analysisType?: string;
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
    lastActivity?: Date;
    theme?: 'light' | 'dark';
  };
}

export interface ChatContext {
  sessionId: string;
  userId: string;
  currentDeck?: DeckData;
  conversationHistory: ChatMessage[];
  preferences: {
    format?: string;
    analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
    includeMetaAnalysis?: boolean;
    includeBudgetOptions?: boolean;
  };
  state: {
    isAnalyzing: boolean;
    lastAnalysisTime?: Date;
    pendingActions: string[];
  };
}

// ==================== DECK TYPES ====================

export interface DeckCard {
  id?: string;
  name: string;
  manaCost: string;
  convertedManaCost: number;
  type: string;
  subtype?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  set: string;
  colors: string[];
  quantity: number;
  category?: 'mainboard' | 'sideboard' | 'maybeboard';
  tags?: string[];
  price?: {
    usd?: number;
    eur?: number;
    tix?: number;
  };
  legality?: {
    [format: string]: 'legal' | 'banned' | 'restricted' | 'not_legal';
  };
}

export interface Deck {
  id?: string;
  userId: string;
  name: string;
  format: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  cards: DeckCard[];
  mainboard: DeckCard[];
  sideboard: DeckCard[];
  maybeboard?: DeckCard[];
  commander?: DeckCard; // For Commander format
  analysis?: DeckAnalysis;
  stats?: DeckStats;
  metadata?: {
    source?: string;
    importedFrom?: string;
    lastModifiedBy?: string;
    version?: number;
    isDigitized?: boolean;
    is3DVisualized?: boolean;
  };
}

export interface DeckData extends Deck {
  deckList: string; // Raw text representation
}

export interface DeckAnalysis {
  competitiveRating?: number;
  colors: string[];
  colorIdentity: string[];
  manaCurve: { [key: number]: number };
  averageManaCost: number;
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
  synergies: string[];
  winConditions: string[];
  manaBase: {
    totalLands: number;
    colorSources: { [color: string]: number };
    recommendations: string[];
    fixingQuality: 'poor' | 'fair' | 'good' | 'excellent';
  };
  archetype?: string;
  powerLevel?: number; // 1-10 scale
  budgetAnalysis?: {
    totalPrice: number;
    expensiveCards: DeckCard[];
    budgetAlternatives: { original: string; alternative: string; savings: number }[];
  };
}

export interface DeckStats {
  views: number;
  likes: number;
  copies: number;
  comments: number;
  rating: number;
  playHistory?: {
    wins: number;
    losses: number;
    draws: number;
    tournaments: number;
  };
}

// ==================== OPENAI TYPES ====================

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  userId?: string;
  sessionId?: string;
  model?: string;
  presencePenalty?: number;
  frequencyPenalty?: number;
  topP?: number;
  stop?: string[];
}

export interface ChatCompletionResponse {
  id: string;
  content: string;
  role: 'assistant';
  finishReason: string;
  usage: TokenUsage;
  timestamp: Date;
  model?: string;
  metadata?: {
    processingTime?: number;
    confidence?: number;
  };
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
  userId?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  usage: TokenUsage;
  model: string;
}

export interface DeckAnalysisRequest {
  deckList: string;
  format?: string;
  analysisType?: 'competitive' | 'casual' | 'budget' | 'meta' | 'comprehensive';
  includeAlternatives?: boolean;
  includeSideboard?: boolean;
  targetBudget?: number;
  metaContext?: string;
}

export interface DeckAnalysisResponse {
  analysis: string;
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
  manaBase: {
    colors: string[];
    curve: { [key: number]: number };
    recommendations: string[];
  };
  sideboard?: string[];
  competitiveRating?: number;
  powerLevel?: number;
  archetype?: string;
  winConditions?: string[];
  budgetOptions?: {
    totalCost: number;
    alternatives: { original: string; alternative: string; savings: number }[];
  };
}

// ==================== STREAMING TYPES ====================

export interface StreamingResponse {
  id: string;
  chunk: string;
  isComplete: boolean;
  metadata?: {
    chunkIndex: number;
    totalChunks?: number;
  };
}

export interface StreamingCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (response: ChatCompletionResponse) => void;
  onError: (error: Error) => void;
  onProgress?: (progress: { current: number; total?: number }) => void;
}

// ==================== QUERY TYPES ====================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
  includeMetadata?: boolean;
}

export interface SearchParams {
  query?: string;
  userId?: string;
  format?: string;
  tags?: string[];
  isPublic?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  priceRange?: {
    min: number;
    max: number;
  };
}

// ==================== UI/UX TYPES ====================

export interface ScrollingWebsiteState {
  currentSection: 'hero' | 'features' | 'decks' | 'chat' | 'about' | 'contact';
  scrollPosition: number;
  isScrolling: boolean;
  animations: {
    fadeIn: boolean;
    slideUp: boolean;
    parallax: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  layout: 'desktop' | 'tablet' | 'mobile';
}

export interface DeckVisualization3D {
  enabled: boolean;
  viewMode: 'grid' | 'stack' | 'fan' | 'curve';
  cardRotation: { x: number; y: number; z: number };
  cameraPosition: { x: number; y: number; z: number };
  lighting: {
    ambient: number;
    directional: number;
    shadows: boolean;
  };
  animations: {
    cardFlip: boolean;
    hoverEffects: boolean;
    transitionSpeed: number;
  };
}

export interface DeckDigitizer {
  isActive: boolean;
  mode: 'camera' | 'upload' | 'manual';
  confidence: number;
  recognizedCards: {
    name: string;
    confidence: number;
    quantity?: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }[];
  processingStatus: 'idle' | 'processing' | 'complete' | 'error';
  settings: {
    autoCorrect: boolean;
    multipleAngles: boolean;
    enhanceImage: boolean;
    batchProcessing: boolean;
  };
}

// ==================== ERROR TYPES ====================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  stack?: string;
}

export interface ValidationError extends AppError {
  field: string;
  value: any;
  constraint: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
    processingTime?: number;
  };
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==================== EXPORT TYPES ====================

export type DeckFormat = 'Standard' | 'Modern' | 'Legacy' | 'Vintage' | 'Commander' | 'Pioneer' | 'Historic' | 'Pauper' | 'Limited';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'mythic';
export type AnalysisDepth = 'basic' | 'detailed' | 'comprehensive';
export type ExportFormat = 'json' | 'txt' | 'mtgo' | 'arena' | 'cockatrice';
export type ImportSource = 'manual' | 'file' | 'url' | 'camera' | 'digitizer';
