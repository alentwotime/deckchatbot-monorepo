import { Request, Response } from 'express';
import { AzureComputerVisionService } from '../services/azure-computer-vision.js';
import { AzureCosmosService } from '../services/azure-cosmos.js';
import { AzureStorageService } from '../services/azure-storage.js';
import { AzureOpenAIService } from '../services/azure-openai.js';
import { ApiResponse } from '../types/index.js';

export class VisualizationController {
  private visionService: AzureComputerVisionService;
  private cosmosService: AzureCosmosService;
  private storageService: AzureStorageService;
  private openAIService: AzureOpenAIService;

  constructor() {
    this.visionService = AzureComputerVisionService.getInstance();
    this.cosmosService = AzureCosmosService.getInstance();
    this.storageService = AzureStorageService.getInstance();
    this.openAIService = AzureOpenAIService.getInstance();
  }

  /**
   * Generate deck blueprint visualization
   */
  public generateDeckBlueprint = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId, userId, settings } = req.body;

      if (!deckId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Deck ID and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      // Get deck data
      const deck = await this.cosmosService.getDeck(deckId, userId);
      if (!deck) {
        res.status(404).json({
          success: false,
          error: 'Deck not found'
        } as ApiResponse<null>);
        return;
      }

      // Default blueprint settings
      const blueprintSettings = {
        format: 'svg',
        style: 'modern',
        includeManaCurve: true,
        includeColorDistribution: true,
        includeCardTypes: true,
        includeStatistics: true,
        theme: 'light',
        dimensions: { width: 1200, height: 800 },
        ...settings
      };

      // Generate blueprint
      const blueprintRequest = {
        deckData: deck,
        settings: blueprintSettings
      };

      const blueprint = await this.visionService.generateDeckBlueprint(blueprintRequest);

      // Store blueprint for future access
      const blueprintRecord = {
        id: `blueprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deckId,
        userId,
        settings: blueprintSettings,
        blueprint,
        createdAt: new Date(),
        metadata: {
          deckName: deck.name,
          cardCount: deck.metadata?.cardCount || 0,
          format: deck.format
        }
      };

      await this.cosmosService.storeBlueprintResult(blueprintRecord);

      // Upload blueprint to storage if it's an image/file
      let blueprintUrl = blueprint.data;
      if (blueprint.format === 'svg' || blueprint.format === 'png') {
        const uploadResult = await this.storageService.uploadFile(
          'blueprints',
          Buffer.from(blueprint.data),
          `blueprint_${blueprintRecord.id}.${blueprint.format}`,
          userId,
          {
            contentType: blueprint.format === 'svg' ? 'image/svg+xml' : 'image/png',
            metadata: {
              deckId,
              type: 'blueprint',
              createdAt: new Date().toISOString()
            }
          }
        );
        blueprintUrl = uploadResult.url;
      }

      res.json({
        success: true,
        data: {
          blueprintId: blueprintRecord.id,
          deckId,
          blueprint: {
            ...blueprint,
            url: blueprintUrl
          },
          settings: blueprintSettings,
          createdAt: blueprintRecord.createdAt
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
   * Create 3D deck model
   */
  public create3DDeckModel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId, userId, modelSettings } = req.body;

      if (!deckId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Deck ID and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      // Get deck data
      const deck = await this.cosmosService.getDeck(deckId, userId);
      if (!deck) {
        res.status(404).json({
          success: false,
          error: 'Deck not found'
        } as ApiResponse<null>);
        return;
      }

      // Default 3D model settings
      const model3DSettings = {
        format: 'gltf',
        quality: 'medium',
        includeCardArt: true,
        stackVisualization: true,
        interactiveElements: true,
        lighting: 'realistic',
        cameraAngle: 'isometric',
        animations: ['shuffle', 'draw', 'play'],
        ...modelSettings
      };

      // Create 3D model
      const modelRequest = {
        deckData: deck,
        settings: model3DSettings
      };

      const model3D = await this.visionService.create3DDeckModel(modelRequest);

      // Store 3D model record
      const modelRecord = {
        id: `model3d_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deckId,
        userId,
        settings: model3DSettings,
        model: model3D,
        createdAt: new Date(),
        metadata: {
          deckName: deck.name,
          cardCount: deck.metadata?.cardCount || 0,
          format: deck.format,
          fileSize: model3D.fileSize || 0
        }
      };

      await this.cosmosService.store3DModelResult(modelRecord);

      // Upload 3D model file to storage
      let modelUrl = model3D.data;
      if (model3D.format === 'gltf' || model3D.format === 'obj') {
        const uploadResult = await this.storageService.uploadFile(
          '3d-models',
          Buffer.from(model3D.data),
          `model_${modelRecord.id}.${model3D.format}`,
          userId,
          {
            contentType: model3D.format === 'gltf' ? 'model/gltf+json' : 'application/octet-stream',
            metadata: {
              deckId,
              type: '3d-model',
              createdAt: new Date().toISOString()
            }
          }
        );
        modelUrl = uploadResult.url;
      }

      res.json({
        success: true,
        data: {
          modelId: modelRecord.id,
          deckId,
          model: {
            ...model3D,
            url: modelUrl
          },
          settings: model3DSettings,
          createdAt: modelRecord.createdAt
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
   * Process uploaded drawing for deck visualization
   */
  public processUploadedDrawing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageUrl, userId, processingOptions } = req.body;

      if (!imageUrl || !userId) {
        res.status(400).json({
          success: false,
          error: 'Image URL and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      // Default processing options
      const options = {
        extractText: true,
        recognizeCards: true,
        analyzeLayout: true,
        generateVisualization: true,
        enhanceImage: true,
        ...processingOptions
      };

      let processingResults: any = {
        imageUrl,
        processingOptions: options
      };

      // Extract text from drawing
      if (options.extractText) {
        try {
          const ocrResult = await this.visionService.extractText({
            imageUrl,
            language: 'en'
          });
          processingResults.extractedText = ocrResult;
        } catch (error) {
          console.error('Text extraction failed:', error);
          processingResults.textExtractionError = 'Failed to extract text';
        }
      }

      // Recognize cards in drawing
      if (options.recognizeCards) {
        try {
          const cardResult = await this.visionService.recognizeCards({
            imageUrl,
            confidence: 0.6
          });
          processingResults.recognizedCards = cardResult;
        } catch (error) {
          console.error('Card recognition failed:', error);
          processingResults.cardRecognitionError = 'Failed to recognize cards';
        }
      }

      // Analyze layout and structure
      if (options.analyzeLayout) {
        try {
          const layoutResult = await this.visionService.analyzeImage({
            imageUrl
          });
          processingResults.layoutAnalysis = layoutResult;
        } catch (error) {
          console.error('Layout analysis failed:', error);
          processingResults.layoutAnalysisError = 'Failed to analyze layout';
        }
      }

      // Generate enhanced visualization
      if (options.generateVisualization && processingResults.recognizedCards) {
        try {
          const visualizationResult = await this.generateDrawingVisualization({
            originalImage: imageUrl,
            recognizedCards: processingResults.recognizedCards,
            extractedText: processingResults.extractedText,
            userId
          });
          processingResults.visualization = visualizationResult;
        } catch (error) {
          console.error('Visualization generation failed:', error);
          processingResults.visualizationError = 'Failed to generate visualization';
        }
      }

      // Store processing result
      const processingRecord = {
        id: `drawing_proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        imageUrl,
        processingOptions: options,
        results: processingResults,
        processedAt: new Date(),
        metadata: {
          cardsFound: processingResults.recognizedCards?.cards?.length || 0,
          textExtracted: !!processingResults.extractedText?.text,
          layoutAnalyzed: !!processingResults.layoutAnalysis,
          visualizationGenerated: !!processingResults.visualization
        }
      };

      await this.cosmosService.storeDrawingProcessingResult(processingRecord);

      res.json({
        success: true,
        data: {
          processingId: processingRecord.id,
          results: processingResults,
          processedAt: processingRecord.processedAt
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in processUploadedDrawing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process uploaded drawing'
      } as ApiResponse<null>);
    }
  };

  /**
   * Generate deck statistics visualization
   */
  public generateDeckStatisticsVisualization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId, userId, visualizationType, settings } = req.body;

      if (!deckId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Deck ID and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      // Get deck data
      const deck = await this.cosmosService.getDeck(deckId, userId);
      if (!deck) {
        res.status(404).json({
          success: false,
          error: 'Deck not found'
        } as ApiResponse<null>);
        return;
      }

      // Calculate comprehensive statistics
      const statistics = await this.calculateComprehensiveStatistics(deck);

      // Default visualization settings
      const vizSettings = {
        type: visualizationType || 'comprehensive',
        format: 'svg',
        theme: 'modern',
        colorScheme: 'auto',
        includeAnimations: true,
        responsive: true,
        ...settings
      };

      // Generate visualization based on type
      let visualization;
      switch (vizSettings.type) {
        case 'mana-curve':
          visualization = await this.generateManaCurveVisualization(statistics.manaCurve, vizSettings);
          break;
        case 'color-distribution':
          visualization = await this.generateColorDistributionVisualization(statistics.colorDistribution, vizSettings);
          break;
        case 'card-types':
          visualization = await this.generateCardTypeVisualization(statistics.cardTypes, vizSettings);
          break;
        case 'rarity-breakdown':
          visualization = await this.generateRarityVisualization(statistics.rarityDistribution, vizSettings);
          break;
        case 'comprehensive':
        default:
          visualization = await this.generateComprehensiveVisualization(statistics, vizSettings);
          break;
      }

      // Store visualization
      const vizRecord = {
        id: `viz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deckId,
        userId,
        type: vizSettings.type,
        settings: vizSettings,
        visualization,
        statistics,
        createdAt: new Date(),
        metadata: {
          deckName: deck.name,
          format: deck.format
        }
      };

      await this.cosmosService.storeVisualizationResult(vizRecord);

      // Upload visualization if it's a file
      let visualizationUrl = visualization.data;
      if (visualization.format === 'svg' || visualization.format === 'png') {
        const uploadResult = await this.storageService.uploadFile(
          'visualizations',
          Buffer.from(visualization.data),
          `viz_${vizRecord.id}.${visualization.format}`,
          userId,
          {
            contentType: visualization.format === 'svg' ? 'image/svg+xml' : 'image/png',
            metadata: {
              deckId,
              type: 'statistics-visualization',
              createdAt: new Date().toISOString()
            }
          }
        );
        visualizationUrl = uploadResult.url;
      }

      res.json({
        success: true,
        data: {
          visualizationId: vizRecord.id,
          deckId,
          type: vizSettings.type,
          visualization: {
            ...visualization,
            url: visualizationUrl
          },
          statistics,
          createdAt: vizRecord.createdAt
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in generateDeckStatisticsVisualization:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate deck statistics visualization'
      } as ApiResponse<null>);
    }
  };

  /**
   * Get visualization history for user
   */
  public getVisualizationHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0, type } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        } as ApiResponse<null>);
        return;
      }

      const history = await this.cosmosService.getUserVisualizationHistory(userId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        type: type as string
      });

      res.json({
        success: true,
        data: {
          visualizations: history,
          userId,
          total: history.length
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in getVisualizationHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve visualization history'
      } as ApiResponse<null>);
    }
  };

  /**
   * Delete visualization
   */
  public deleteVisualization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { visualizationId } = req.params;
      const { userId } = req.body;

      if (!visualizationId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Visualization ID and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      // Get visualization record
      const visualization = await this.cosmosService.getVisualization(visualizationId, userId);
      if (!visualization) {
        res.status(404).json({
          success: false,
          error: 'Visualization not found'
        } as ApiResponse<null>);
        return;
      }

      // Delete from storage if it exists
      if (visualization.storageUrl) {
        try {
          const containerName = visualization.type === '3d-model' ? '3d-models' : 
                               visualization.type === 'blueprint' ? 'blueprints' : 'visualizations';
          await this.storageService.deleteFile(containerName, visualization.fileName);
        } catch (storageError) {
          console.error('Failed to delete from storage:', storageError);
        }
      }

      // Delete from database
      await this.cosmosService.deleteVisualization(visualizationId, userId);

      res.json({
        success: true,
        data: {
          visualizationId,
          deleted: true,
          deletedAt: new Date()
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in deleteVisualization:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete visualization'
      } as ApiResponse<null>);
    }
  };

  // Helper methods
  private async calculateComprehensiveStatistics(deck: any): Promise<any> {
    const cards = deck.cards || [];
    
    return {
      manaCurve: this.calculateManaCurve(cards),
      colorDistribution: this.calculateColorDistribution(cards),
      cardTypes: this.calculateCardTypeDistribution(cards),
      rarityDistribution: this.calculateRarityDistribution(cards),
      averageCMC: this.calculateAverageCMC(cards),
      totalCards: cards.reduce((sum: number, card: any) => sum + card.quantity, 0),
      uniqueCards: cards.length,
      competitiveRating: await this.openAIService.calculateCompetitiveRating(
        cards.map((card: any) => `${card.quantity} ${card.name}`).join('\n'),
        deck.format
      )
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

  private calculateAverageCMC(cards: any[]): number {
    const totalCMC = cards.reduce((sum, card) => sum + (card.cmc || 0) * card.quantity, 0);
    const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
    return totalCards > 0 ? totalCMC / totalCards : 0;
  }

  private async generateDrawingVisualization(params: any): Promise<any> {
    // This would integrate with the vision service to create enhanced visualizations
    // For now, return a placeholder structure
    return {
      type: 'enhanced-drawing',
      format: 'svg',
      data: '<svg><!-- Enhanced drawing visualization --></svg>',
      metadata: {
        originalImage: params.originalImage,
        cardsFound: params.recognizedCards?.cards?.length || 0,
        enhancementApplied: true
      }
    };
  }

  private async generateManaCurveVisualization(manaCurve: any, settings: any): Promise<any> {
    // Generate mana curve chart
    return {
      type: 'mana-curve',
      format: settings.format,
      data: `<!-- Mana curve visualization for ${JSON.stringify(manaCurve)} -->`,
      metadata: { chartType: 'bar', dataPoints: Object.keys(manaCurve).length }
    };
  }

  private async generateColorDistributionVisualization(colorDist: any, settings: any): Promise<any> {
    // Generate color distribution pie chart
    return {
      type: 'color-distribution',
      format: settings.format,
      data: `<!-- Color distribution visualization for ${JSON.stringify(colorDist)} -->`,
      metadata: { chartType: 'pie', colors: Object.keys(colorDist).length }
    };
  }

  private async generateCardTypeVisualization(cardTypes: any, settings: any): Promise<any> {
    // Generate card type breakdown
    return {
      type: 'card-types',
      format: settings.format,
      data: `<!-- Card type visualization for ${JSON.stringify(cardTypes)} -->`,
      metadata: { chartType: 'donut', types: Object.keys(cardTypes).length }
    };
  }

  private async generateRarityVisualization(rarityDist: any, settings: any): Promise<any> {
    // Generate rarity breakdown
    return {
      type: 'rarity-breakdown',
      format: settings.format,
      data: `<!-- Rarity visualization for ${JSON.stringify(rarityDist)} -->`,
      metadata: { chartType: 'stacked-bar', rarities: Object.keys(rarityDist).length }
    };
  }

  private async generateComprehensiveVisualization(statistics: any, settings: any): Promise<any> {
    // Generate comprehensive dashboard
    return {
      type: 'comprehensive',
      format: settings.format,
      data: `<!-- Comprehensive visualization dashboard -->`,
      metadata: { 
        chartType: 'dashboard', 
        components: ['mana-curve', 'color-distribution', 'card-types', 'statistics'],
        totalCards: statistics.totalCards
      }
    };
  }
}
