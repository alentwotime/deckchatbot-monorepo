/**
 * Azure OpenAI Service Integration
 * Provides chat completion, streaming responses, embeddings, and deck analysis
 */

import { OpenAIApi, Configuration } from 'openai';
import { azureConfig } from './azure-config.js';

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
    curve: { [key: number]: number };
    recommendations: string[];
  };
  sideboard?: string[];
  competitiveRating?: number;
}

class AzureOpenAIService {
  private static instance: AzureOpenAIService;
  private openai: OpenAIApi;
  private config: any;

  // Magic: The Gathering system prompt
  private readonly MTG_SYSTEM_PROMPT = `You are an expert Magic: The Gathering deck analyst and strategist. You have deep knowledge of:

- All MTG formats (Standard, Modern, Legacy, Vintage, Commander, Pioneer, etc.)
- Card interactions, synergies, and combos
- Mana curve optimization and mana base construction
- Meta game analysis and competitive strategies
- Deck archetypes and their strengths/weaknesses
- Sideboard construction and sideboarding strategies
- Budget alternatives and card substitutions

When analyzing decks, provide:
1. Detailed strategic analysis
2. Mana curve and color balance assessment
3. Key synergies and win conditions
4. Competitive viability in the current meta
5. Specific improvement suggestions
6. Budget alternatives when relevant
7. Sideboard recommendations

Be thorough, accurate, and helpful. Use proper MTG terminology and consider the current meta when making recommendations.`;

  private constructor() {
    this.config = azureConfig.getOpenAIConfig();
    this.initializeOpenAI();
  }

  public static getInstance(): AzureOpenAIService {
    if (!AzureOpenAIService.instance) {
      AzureOpenAIService.instance = new AzureOpenAIService();
    }
    return AzureOpenAIService.instance;
  }

  /**
   * Initialize OpenAI client with Azure configuration
   */
  private initializeOpenAI(): void {
    if (!this.config.apiKey || !this.config.endpoint) {
      console.warn('⚠️  Azure OpenAI not configured. Some features will be unavailable.');
      return;
    }

    const configuration = new Configuration({
      apiKey: this.config.apiKey,
      basePath: `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}`,
      baseOptions: {
        headers: {
          'api-key': this.config.apiKey,
        },
        params: {
          'api-version': this.config.apiVersion,
        },
      },
    });

    this.openai = new OpenAIApi(configuration);
  }

  /**
   * Generate chat completion
   */
  public async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.openai) {
      throw new Error('Azure OpenAI not configured');
    }

    try {
      const response = await this.openai.createChatCompletion({
        model: this.config.model,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature || this.config.temperature,
        stream: false,
      });

      const choice = response.data.choices[0];
      
      return {
        id: response.data.id,
        content: choice.message?.content || '',
        role: 'assistant',
        finishReason: choice.finish_reason || 'stop',
        usage: {
          promptTokens: response.data.usage?.prompt_tokens || 0,
          completionTokens: response.data.usage?.completion_tokens || 0,
          totalTokens: response.data.usage?.total_tokens || 0,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error creating chat completion:', error);
      throw new Error(`Failed to create chat completion: ${error.message}`);
    }
  }

  /**
   * Generate streaming chat completion
   */
  public async createStreamingChatCompletion(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete: (response: ChatCompletionResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!this.openai) {
      throw new Error('Azure OpenAI not configured');
    }

    try {
      const response = await this.openai.createChatCompletion({
        model: this.config.model,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature || this.config.temperature,
        stream: true,
      }, { responseType: 'stream' });

      let fullContent = '';
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.includes('[DONE]')) {
            onComplete({
              id: 'stream-completion',
              content: fullContent,
              role: 'assistant',
              finishReason: 'stop',
              usage,
              timestamp: new Date(),
            });
            return;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta;
              
              if (delta?.content) {
                fullContent += delta.content;
                onChunk(delta.content);
              }

              if (data.usage) {
                usage = {
                  promptTokens: data.usage.prompt_tokens || 0,
                  completionTokens: data.usage.completion_tokens || 0,
                  totalTokens: data.usage.total_tokens || 0,
                };
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', parseError);
            }
          }
        }
      });

      response.data.on('error', (error: Error) => {
        onError(error);
      });

    } catch (error) {
      console.error('Error creating streaming chat completion:', error);
      onError(new Error(`Failed to create streaming chat completion: ${error.message}`));
    }
  }

  /**
   * Generate embeddings
   */
  public async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.openai) {
      throw new Error('Azure OpenAI not configured');
    }

    try {
      const response = await this.openai.createEmbedding({
        model: request.model || 'text-embedding-ada-002',
        input: request.text,
      });

      return {
        embedding: response.data.data[0].embedding,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
      };
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw new Error(`Failed to create embedding: ${error.message}`);
    }
  }

  /**
   * Analyze Magic: The Gathering deck
   */
  public async analyzeDeck(request: DeckAnalysisRequest): Promise<DeckAnalysisResponse> {
    const analysisPrompt = `${this.MTG_SYSTEM_PROMPT}

Please analyze the following Magic: The Gathering deck:

Format: ${request.format || 'Not specified'}
Analysis Type: ${request.analysisType || 'general'}

Deck List:
${request.deckList}

Provide a comprehensive analysis including:
1. Overall strategy and win conditions
2. Mana curve analysis
3. Color balance and mana base evaluation
4. Key synergies and interactions
5. Strengths and weaknesses
6. Competitive viability
7. Specific improvement suggestions
8. Budget alternatives if applicable
9. Sideboard recommendations

Format your response as a detailed analysis with clear sections.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: this.MTG_SYSTEM_PROMPT },
      { role: 'user', content: analysisPrompt }
    ];

    try {
      const response = await this.createChatCompletion({
        messages,
        maxTokens: 2000,
        temperature: 0.7,
      });

      // Parse the response to extract structured data
      const analysis = response.content;
      
      // Extract mana curve from deck list
      const manaBase = this.analyzeManaBase(request.deckList);
      
      // Extract suggestions, strengths, and weaknesses from the analysis
      const suggestions = this.extractSuggestions(analysis);
      const strengths = this.extractStrengths(analysis);
      const weaknesses = this.extractWeaknesses(analysis);

      return {
        analysis,
        suggestions,
        strengths,
        weaknesses,
        manaBase,
        competitiveRating: this.calculateCompetitiveRating(request.deckList, request.format),
      };
    } catch (error) {
      console.error('Error analyzing deck:', error);
      throw new Error(`Failed to analyze deck: ${error.message}`);
    }
  }

  /**
   * Analyze mana base from deck list
   */
  private analyzeManaBase(deckList: string): {
    colors: string[];
    curve: { [key: number]: number };
    recommendations: string[];
  } {
    const lines = deckList.split('\n').filter(line => line.trim());
    const colors = new Set<string>();
    const curve: { [key: number]: number } = {};
    
    // Simple parsing - in a real implementation, you'd use a card database
    lines.forEach(line => {
      const match = line.match(/^(\d+)\s+(.+)/);
      if (match) {
        const quantity = parseInt(match[1]);
        const cardName = match[2].trim();
        
        // This is a simplified example - you'd need actual card data
        // For now, we'll make some basic assumptions
        if (cardName.toLowerCase().includes('mountain') || cardName.toLowerCase().includes('red')) {
          colors.add('Red');
        }
        if (cardName.toLowerCase().includes('island') || cardName.toLowerCase().includes('blue')) {
          colors.add('Blue');
        }
        if (cardName.toLowerCase().includes('forest') || cardName.toLowerCase().includes('green')) {
          colors.add('Green');
        }
        if (cardName.toLowerCase().includes('plains') || cardName.toLowerCase().includes('white')) {
          colors.add('White');
        }
        if (cardName.toLowerCase().includes('swamp') || cardName.toLowerCase().includes('black')) {
          colors.add('Black');
        }
      }
    });

    return {
      colors: Array.from(colors),
      curve,
      recommendations: [
        'Consider adding more dual lands for better mana fixing',
        'Ensure adequate basic lands for early game consistency',
        'Consider utility lands that support your strategy'
      ]
    };
  }

  /**
   * Extract suggestions from analysis text
   */
  private extractSuggestions(analysis: string): string[] {
    const suggestions: string[] = [];
    const lines = analysis.split('\n');
    
    let inSuggestionsSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('suggestion') || line.toLowerCase().includes('improvement')) {
        inSuggestionsSection = true;
        continue;
      }
      
      if (inSuggestionsSection && line.trim().startsWith('-')) {
        suggestions.push(line.trim().substring(1).trim());
      }
      
      if (inSuggestionsSection && line.trim() === '') {
        inSuggestionsSection = false;
      }
    }
    
    return suggestions.length > 0 ? suggestions : [
      'Consider optimizing your mana curve',
      'Add more card draw or selection',
      'Include removal spells for key threats'
    ];
  }

  /**
   * Extract strengths from analysis text
   */
  private extractStrengths(analysis: string): string[] {
    const strengths: string[] = [];
    const lines = analysis.split('\n');
    
    let inStrengthsSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('strength')) {
        inStrengthsSection = true;
        continue;
      }
      
      if (inStrengthsSection && line.trim().startsWith('-')) {
        strengths.push(line.trim().substring(1).trim());
      }
      
      if (inStrengthsSection && line.trim() === '') {
        inStrengthsSection = false;
      }
    }
    
    return strengths.length > 0 ? strengths : [
      'Consistent strategy',
      'Good card synergies'
    ];
  }

  /**
   * Extract weaknesses from analysis text
   */
  private extractWeaknesses(analysis: string): string[] {
    const weaknesses: string[] = [];
    const lines = analysis.split('\n');
    
    let inWeaknessesSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('weakness')) {
        inWeaknessesSection = true;
        continue;
      }
      
      if (inWeaknessesSection && line.trim().startsWith('-')) {
        weaknesses.push(line.trim().substring(1).trim());
      }
      
      if (inWeaknessesSection && line.trim() === '') {
        inWeaknessesSection = false;
      }
    }
    
    return weaknesses.length > 0 ? weaknesses : [
      'May struggle against fast aggro',
      'Limited interaction with opponents'
    ];
  }

  /**
   * Calculate competitive rating (simplified)
   */
  private calculateCompetitiveRating(deckList: string, format?: string): number {
    // This is a simplified rating system
    // In a real implementation, you'd analyze card power level, meta relevance, etc.
    const lines = deckList.split('\n').filter(line => line.trim());
    const cardCount = lines.length;
    
    // Basic rating based on deck size and format
    let rating = 5; // Base rating
    
    if (format === 'Standard' && cardCount >= 60) rating += 1;
    if (format === 'Modern' && cardCount >= 60) rating += 1;
    if (format === 'Commander' && cardCount >= 100) rating += 1;
    
    return Math.min(10, Math.max(1, rating));
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{ status: string; configured: boolean; error?: string }> {
    try {
      if (!this.config.apiKey || !this.config.endpoint) {
        return {
          status: 'unhealthy',
          configured: false,
          error: 'Azure OpenAI not configured'
        };
      }

      // Simple test request
      const testResponse = await this.createChatCompletion({
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 10,
      });

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
}

// Export singleton instance
export const azureOpenAI = AzureOpenAIService.getInstance();
export default azureOpenAI;
