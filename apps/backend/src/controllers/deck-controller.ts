import { Request, Response } from 'express';
import { AzureCosmosService } from '../services/azure-cosmos.js';
import { AzureStorageService } from '../services/azure-storage.js';
import { AzureComputerVisionService } from '../services/azure-computer-vision.js';
import { AzureOpenAIService } from '../services/azure-openai.js';
import { DeckData, ApiResponse } from '../types/index.js';

export class DeckController {
  private cosmosService: AzureCosmosService;
  private storageService: AzureStorageService;
  private visionService: AzureComputerVisionService;
  private openAIService: AzureOpenAIService;

  constructor() {
    this.cosmosService = AzureCosmosService.getInstance();
    this.storageService = AzureStorageService.getInstance();
    this.visionService = AzureComputerVisionService.getInstance();
    this.openAIService = AzureOpenAIService.getInstance();
  }

  /**
   * Save a deck
   */
  public saveDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, cards, format, description, userId, tags, isPublic } = req.body;

      if (!name || !cards || !userId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, cards, userId'
        } as ApiResponse<null>);
        return;
      }

      const deck: DeckData = {
        id: `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        cards,
        format: format || 'standard',
        description: description || '',
        userId,
        tags: tags || [],
        isPublic: isPublic || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        statistics: this.calculateDeckStatistics(cards),
        metadata: {
          cardCount: cards.reduce((sum: number, card: any) => sum + card.quantity, 0),
          colors: this.extractColors(cards),
          manaCurve: this.calculateManaCurve(cards)
        }
      };

      await this.cosmosService.storeDeck(deck);

      res.json({
        success: true,
        data: deck
      } as ApiResponse<DeckData>);

    } catch (error) {
      console.error('Error in saveDeck:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save deck'
      } as ApiResponse<null>);
    }
  };

  /**
   * Retrieve a deck by ID
   */
  public getDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId } = req.params;
      const { userId } = req.query;

      if (!deckId) {
        res.status(400).json({
          success: false,
          error: 'Deck ID is required'
        } as ApiResponse<null>);
        return;
      }

      const deck = await this.cosmosService.getDeck(deckId, userId as string);

      if (!deck) {
        res.status(404).json({
          success: false,
          error: 'Deck not found'
        } as ApiResponse<null>);
        return;
      }

      res.json({
        success: true,
        data: deck
      } as ApiResponse<DeckData>);

    } catch (error) {
      console.error('Error in getDeck:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve deck'
      } as ApiResponse<null>);
    }
  };

  /**
   * Search and filter decks
   */
  public searchDecks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        query, 
        format, 
        colors, 
        tags, 
        userId, 
        isPublic, 
        limit = 20, 
        offset = 0,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
      } = req.query;

      const searchParams = {
        query: query as string,
        format: format as string,
        colors: colors ? (colors as string).split(',') : undefined,
        tags: tags ? (tags as string).split(',') : undefined,
        userId: userId as string,
        isPublic: isPublic === 'true',
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const decks = await this.cosmosService.searchDecks(searchParams, options);

      res.json({
        success: true,
        data: {
          decks,
          searchParams,
          total: decks.length
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in searchDecks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search decks'
      } as ApiResponse<null>);
    }
  };

  /**
   * Update a deck
   */
  public updateDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId } = req.params;
      const { userId, updates } = req.body;

      if (!deckId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Deck ID and User ID are required'
        } as ApiResponse<null>);
        return;
      }

      // Recalculate statistics if cards were updated
      if (updates.cards) {
        updates.statistics = this.calculateDeckStatistics(updates.cards);
        updates.metadata = {
          ...updates.metadata,
          cardCount: updates.cards.reduce((sum: number, card: any) => sum + card.quantity, 0),
          colors: this.extractColors(updates.cards),
          manaCurve: this.calculateManaCurve(updates.cards)
        };
      }

      const updatedDeck = await this.cosmosService.updateDeck(deckId, userId, {
        ...updates,
        updatedAt: new Date(),
        version: (updates.version || 1) + 1
      });

      res.json({
        success: true,
        data: updatedDeck
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in updateDeck:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update deck'
      } as ApiResponse<null>);
    }
  };

  /**
   * Delete a deck
   */
  public deleteDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId } = req.params;
      const { userId } = req.body;

      if (!deckId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Deck ID and User ID are required'
        } as ApiResponse<null>);
        return;
      }

      await this.cosmosService.deleteDeck(deckId, userId);

      res.json({
        success: true,
        data: { deckId, deleted: true }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in deleteDeck:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete deck'
      } as ApiResponse<null>);
    }
  };

  /**
   * Export deck in various formats
   */
  public exportDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId } = req.params;
      const { format = 'text', userId } = req.query;

      if (!deckId) {
        res.status(400).json({
          success: false,
          error: 'Deck ID is required'
        } as ApiResponse<null>);
        return;
      }

      const deck = await this.cosmosService.getDeck(deckId, userId as string);
      if (!deck) {
        res.status(404).json({
          success: false,
          error: 'Deck not found'
        } as ApiResponse<null>);
        return;
      }

      const exportResult = await this.storageService.exportDeck(deck, format as string);

      res.json({
        success: true,
        data: {
          deckId,
          format,
          exportUrl: exportResult.url,
          fileName: exportResult.fileName
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in exportDeck:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export deck'
      } as ApiResponse<null>);
    }
  };

  /**
   * Import deck from file
   */
  public importDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const { containerName, blobName, userId, deckName } = req.body;

      if (!containerName || !blobName || !userId) {
        res.status(400).json({
          success: false,
          error: 'Container name, blob name, and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      const importedDeck = await this.storageService.importDeck(containerName, blobName);
      
      // Create deck record in database
      const deck: DeckData = {
        id: `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: deckName || importedDeck.name || 'Imported Deck',
        cards: importedDeck.cards,
        format: importedDeck.format || 'standard',
        description: importedDeck.description || 'Imported from file',
        userId,
        tags: importedDeck.tags || [],
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        statistics: this.calculateDeckStatistics(importedDeck.cards),
        metadata: {
          cardCount: importedDeck.cards.reduce((sum: number, card: any) => sum + card.quantity, 0),
          colors: this.extractColors(importedDeck.cards),
          manaCurve: this.calculateManaCurve(importedDeck.cards),
          imported: true,
          importSource: blobName
        }
      };

      await this.cosmosService.storeDeck(deck);

      res.json({
        success: true,
        data: deck
      } as ApiResponse<DeckData>);

    } catch (error) {
      console.error('Error in importDeck:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import deck'
      } as ApiResponse<null>);
    }
  };

  /**
   * Get deck statistics
   */
  public getDeckStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId } = req.params;
      const { userId } = req.query;

      if (!deckId) {
        res.status(400).json({
          success: false,
          error: 'Deck ID is required'
        } as ApiResponse<null>);
        return;
      }

      const deck = await this.cosmosService.getDeck(deckId, userId as string);
      if (!deck) {
        res.status(404).json({
          success: false,
          error: 'Deck not found'
        } as ApiResponse<null>);
        return;
      }

      const detailedStats = {
        ...deck.statistics,
        manaCurve: this.calculateManaCurve(deck.cards),
        colorDistribution: this.calculateColorDistribution(deck.cards),
        cardTypes: this.calculateCardTypeDistribution(deck.cards),
        rarityDistribution: this.calculateRarityDistribution(deck.cards),
        competitiveRating: await this.openAIService.calculateCompetitiveRating(
          deck.cards.map((card: any) => `${card.quantity} ${card.name}`).join('\n'),
          deck.format
        )
      };

      res.json({
        success: true,
        data: {
          deckId,
          statistics: detailedStats
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in getDeckStatistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate deck statistics'
      } as ApiResponse<null>);
    }
  };

  /**
   * NEW: Generate deck blueprint
   */
  public generateDeckBlueprint = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId } = req.params;
      const { userId, settings } = req.body;

      if (!deckId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Deck ID and User ID are required'
        } as ApiResponse<null>);
        return;
      }

      const deck = await this.cosmosService.getDeck(deckId, userId);
      if (!deck) {
        res.status(404).json({
          success: false,
          error: 'Deck not found'
        } as ApiResponse<null>);
        return;
      }

      // Generate blueprint using computer vision service
      const blueprintRequest = {
        deckData: deck,
        settings: settings || {
          includeManaCurve: true,
          includeColorDistribution: true,
          includeCardTypes: true,
          style: 'modern',
          format: 'svg'
        }
      };

      const blueprint = await this.visionService.generateDeckBlueprint(blueprintRequest);

      res.json({
        success: true,
        data: {
          deckId,
          blueprint,
          generatedAt: new Date()
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in generateDeckBlueprint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate deck blueprint'
      } as ApiResponse<null>);
    }
  };

  /**
   * NEW: Create 3D deck model
   */
  public create3DDeckModel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId } = req.params;
      const { userId, modelSettings } = req.body;

      if (!deckId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Deck ID and User ID are required'
        } as ApiResponse<null>);
        return;
      }

      const deck = await this.cosmosService.getDeck(deckId, userId);
      if (!deck) {
        res.status(404).json({
          success: false,
          error: 'Deck not found'
        } as ApiResponse<null>);
        return;
      }

      // Create 3D model using computer vision service
      const modelRequest = {
        deckData: deck,
        settings: modelSettings || {
          format: 'gltf',
          quality: 'medium',
          includeCardArt: true,
          stackVisualization: true,
          interactiveElements: true
        }
      };

      const model3D = await this.visionService.create3DDeckModel(modelRequest);

      res.json({
        success: true,
        data: {
          deckId,
          model3D,
          generatedAt: new Date()
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in create3DDeckModel:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create 3D deck model'
      } as ApiResponse<null>);
    }
  };

  /**
   * Get popular decks
   */
  public getPopularDecks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { format, limit = 10 } = req.query;

      const popularDecks = await this.cosmosService.getPopularDecks(
        format as string, 
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          decks: popularDecks,
          format,
          limit: parseInt(limit as string)
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in getPopularDecks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve popular decks'
      } as ApiResponse<null>);
    }
  };

  // Helper methods
  private calculateDeckStatistics(cards: any[]): any {
    const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
    const uniqueCards = cards.length;
    const averageCMC = this.calculateAverageCMC(cards);
    
    return {
      totalCards,
      uniqueCards,
      averageCMC,
      colors: this.extractColors(cards),
      manaCurve: this.calculateManaCurve(cards)
    };
  }

  private calculateManaCurve(cards: any[]): { [key: string]: number } {
    const curve: { [key: string]: number } = {};
    
    cards.forEach(card => {
      const cmc = card.cmc || 0;
      const key = cmc >= 7 ? '7+' : cmc.toString();
      curve[key] = (curve[key] || 0) + card.quantity;
    });
    
    return curve;
  }

  private calculateAverageCMC(cards: any[]): number {
    const totalCMC = cards.reduce((sum, card) => sum + (card.cmc || 0) * card.quantity, 0);
    const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
    return totalCards > 0 ? totalCMC / totalCards : 0;
  }

  private extractColors(cards: any[]): string[] {
    const colors = new Set<string>();
    cards.forEach(card => {
      if (card.colors) {
        card.colors.forEach((color: string) => colors.add(color));
      }
    });
    return Array.from(colors);
  }

  private calculateColorDistribution(cards: any[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    
    cards.forEach(card => {
      if (card.colors && card.colors.length > 0) {
        card.colors.forEach((color: string) => {
          distribution[color] = (distribution[color] || 0) + card.quantity;
        });
      } else {
        distribution['Colorless'] = (distribution['Colorless'] || 0) + card.quantity;
      }
    });
    
    return distribution;
  }

  private calculateCardTypeDistribution(cards: any[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    
    cards.forEach(card => {
      const type = card.type_line ? card.type_line.split(' ')[0] : 'Unknown';
      distribution[type] = (distribution[type] || 0) + card.quantity;
    });
    
    return distribution;
  }

  private calculateRarityDistribution(cards: any[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    
    cards.forEach(card => {
      const rarity = card.rarity || 'common';
      distribution[rarity] = (distribution[rarity] || 0) + card.quantity;
    });
    
    return distribution;
  }
}
