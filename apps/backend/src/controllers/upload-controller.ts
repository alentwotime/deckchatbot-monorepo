import { Request, Response } from 'express';
import { AzureStorageService } from '../services/azure-storage.js';
import { AzureComputerVisionService } from '../services/azure-computer-vision.js';
import { AzureCosmosService } from '../services/azure-cosmos.js';
import { ApiResponse } from '../types/index.js';
import * as multer from 'multer';
import * as path from 'path';

export class UploadController {
  private storageService: AzureStorageService;
  private visionService: AzureComputerVisionService;
  private cosmosService: AzureCosmosService;

  constructor() {
    this.storageService = AzureStorageService.getInstance();
    this.visionService = AzureComputerVisionService.getInstance();
    this.cosmosService = AzureCosmosService.getInstance();
  }

  /**
   * Upload single image
   */
  public uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, description, tags } = req.body;
      const file = req.file;

      if (!file || !userId) {
        res.status(400).json({
          success: false,
          error: 'File and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
        } as ApiResponse<null>);
        return;
      }

      // Upload to Azure Storage
      const uploadResult = await this.storageService.uploadFile(
        'images',
        file,
        file.originalname,
        userId,
        {
          contentType: file.mimetype,
          metadata: {
            description: description || '',
            tags: tags || '',
            uploadedAt: new Date().toISOString()
          }
        }
      );

      res.json({
        success: true,
        data: {
          uploadId: uploadResult.blobName,
          url: uploadResult.url,
          fileName: file.originalname,
          size: file.size,
          contentType: file.mimetype,
          uploadedAt: new Date()
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in uploadImage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image'
      } as ApiResponse<null>);
    }
  };

  /**
   * Upload and process drawing
   */
  public uploadDrawing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, processOCR = true, recognizeCards = true } = req.body;
      const file = req.file;

      if (!file || !userId) {
        res.status(400).json({
          success: false,
          error: 'File and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      // Upload to Azure Storage
      const uploadResult = await this.storageService.uploadFile(
        'drawings',
        file,
        file.originalname,
        userId,
        {
          contentType: file.mimetype,
          metadata: {
            type: 'drawing',
            uploadedAt: new Date().toISOString()
          }
        }
      );

      let processingResults: any = {
        uploadId: uploadResult.blobName,
        url: uploadResult.url,
        fileName: file.originalname
      };

      // Process OCR if requested
      if (processOCR) {
        try {
          const ocrResult = await this.visionService.extractText({
            imageUrl: uploadResult.url,
            language: 'en'
          });
          processingResults.ocr = ocrResult;
        } catch (ocrError) {
          console.error('OCR processing failed:', ocrError);
          processingResults.ocrError = 'OCR processing failed';
        }
      }

      // Recognize cards if requested
      if (recognizeCards) {
        try {
          const cardRecognitionResult = await this.visionService.recognizeCards({
            imageUrl: uploadResult.url,
            confidence: 0.7
          });
          processingResults.cards = cardRecognitionResult;
        } catch (cardError) {
          console.error('Card recognition failed:', cardError);
          processingResults.cardError = 'Card recognition failed';
        }
      }

      res.json({
        success: true,
        data: processingResults
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in uploadDrawing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload and process drawing'
      } as ApiResponse<null>);
    }
  };

  /**
   * Extract text from uploaded image using OCR
   */
  public extractTextFromImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageUrl, language = 'en', userId } = req.body;

      if (!imageUrl || !userId) {
        res.status(400).json({
          success: false,
          error: 'Image URL and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      const ocrResult = await this.visionService.extractText({
        imageUrl,
        language
      });

      // Store OCR result for future reference
      const ocrRecord = {
        id: `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        imageUrl,
        language,
        extractedText: ocrResult.text,
        confidence: ocrResult.confidence,
        regions: ocrResult.regions,
        processedAt: new Date(),
        metadata: {
          wordCount: ocrResult.text.split(' ').length,
          lineCount: ocrResult.regions?.length || 0
        }
      };

      // Store in database for history
      await this.cosmosService.storeOCRResult(ocrRecord);

      res.json({
        success: true,
        data: {
          ocrId: ocrRecord.id,
          extractedText: ocrResult.text,
          confidence: ocrResult.confidence,
          regions: ocrResult.regions,
          processedAt: ocrRecord.processedAt
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in extractTextFromImage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extract text from image'
      } as ApiResponse<null>);
    }
  };

  /**
   * Recognize cards from uploaded image
   */
  public recognizeCardsFromImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageUrl, confidence = 0.7, userId } = req.body;

      if (!imageUrl || !userId) {
        res.status(400).json({
          success: false,
          error: 'Image URL and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      const cardRecognitionResult = await this.visionService.recognizeCards({
        imageUrl,
        confidence: parseFloat(confidence)
      });

      // Store recognition result
      const recognitionRecord = {
        id: `card_rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        imageUrl,
        confidence: parseFloat(confidence),
        recognizedCards: cardRecognitionResult.cards,
        totalCardsFound: cardRecognitionResult.cards?.length || 0,
        processedAt: new Date(),
        metadata: {
          processingTime: cardRecognitionResult.processingTime,
          algorithm: 'azure-computer-vision'
        }
      };

      await this.cosmosService.storeCardRecognitionResult(recognitionRecord);

      res.json({
        success: true,
        data: {
          recognitionId: recognitionRecord.id,
          cards: cardRecognitionResult.cards,
          totalCardsFound: recognitionRecord.totalCardsFound,
          confidence: parseFloat(confidence),
          processedAt: recognitionRecord.processedAt
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in recognizeCardsFromImage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to recognize cards from image'
      } as ApiResponse<null>);
    }
  };

  /**
   * Analyze deck photo (comprehensive analysis)
   */
  public analyzeDeckPhoto = async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageUrl, userId, analysisOptions } = req.body;

      if (!imageUrl || !userId) {
        res.status(400).json({
          success: false,
          error: 'Image URL and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      const analysisRequest = {
        imageUrl,
        options: analysisOptions || {
          recognizeCards: true,
          extractText: true,
          analyzeLayout: true,
          detectDuplicates: true,
          estimateValue: true
        }
      };

      const analysisResult = await this.visionService.analyzeDeckPhoto(analysisRequest);

      // Store comprehensive analysis result
      const analysisRecord = {
        id: `deck_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        imageUrl,
        analysisOptions: analysisRequest.options,
        results: analysisResult,
        processedAt: new Date(),
        metadata: {
          cardsDetected: analysisResult.cards?.length || 0,
          textExtracted: !!analysisResult.extractedText,
          layoutAnalyzed: !!analysisResult.layout,
          estimatedValue: analysisResult.estimatedValue || 0
        }
      };

      await this.cosmosService.storeDeckAnalysisResult(analysisRecord);

      res.json({
        success: true,
        data: {
          analysisId: analysisRecord.id,
          results: analysisResult,
          processedAt: analysisRecord.processedAt
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in analyzeDeckPhoto:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze deck photo'
      } as ApiResponse<null>);
    }
  };

  /**
   * Batch process multiple images
   */
  public batchProcessImages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageUrls, userId, processingOptions } = req.body;

      if (!imageUrls || !Array.isArray(imageUrls) || !userId) {
        res.status(400).json({
          success: false,
          error: 'Image URLs array and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      if (imageUrls.length > 10) {
        res.status(400).json({
          success: false,
          error: 'Maximum 10 images allowed per batch'
        } as ApiResponse<null>);
        return;
      }

      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const results: any[] = [];

      // Process each image
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        
        try {
          let imageResult: any = {
            imageUrl,
            index: i,
            status: 'processing'
          };

          // OCR processing
          if (processingOptions?.extractText) {
            const ocrResult = await this.visionService.extractText({
              imageUrl,
              language: processingOptions.language || 'en'
            });
            imageResult.ocr = ocrResult;
          }

          // Card recognition
          if (processingOptions?.recognizeCards) {
            const cardResult = await this.visionService.recognizeCards({
              imageUrl,
              confidence: processingOptions.confidence || 0.7
            });
            imageResult.cards = cardResult;
          }

          // Image analysis
          if (processingOptions?.analyzeImage) {
            const analysisResult = await this.visionService.analyzeImage({
              imageUrl
            });
            imageResult.analysis = analysisResult;
          }

          imageResult.status = 'completed';
          results.push(imageResult);

        } catch (imageError) {
          console.error(`Error processing image ${i}:`, imageError);
          results.push({
            imageUrl,
            index: i,
            status: 'failed',
            error: 'Processing failed'
          });
        }
      }

      // Store batch processing result
      const batchRecord = {
        id: batchId,
        userId,
        imageUrls,
        processingOptions,
        results,
        processedAt: new Date(),
        metadata: {
          totalImages: imageUrls.length,
          successfulImages: results.filter(r => r.status === 'completed').length,
          failedImages: results.filter(r => r.status === 'failed').length
        }
      };

      await this.cosmosService.storeBatchProcessingResult(batchRecord);

      res.json({
        success: true,
        data: {
          batchId,
          results,
          summary: batchRecord.metadata,
          processedAt: batchRecord.processedAt
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in batchProcessImages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to batch process images'
      } as ApiResponse<null>);
    }
  };

  /**
   * Get upload history for user
   */
  public getUploadHistory = async (req: Request, res: Response): Promise<void> => {
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

      const history = await this.cosmosService.getUserUploadHistory(userId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        type: type as string
      });

      res.json({
        success: true,
        data: {
          uploads: history,
          userId,
          total: history.length
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in getUploadHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve upload history'
      } as ApiResponse<null>);
    }
  };

  /**
   * Delete uploaded file
   */
  public deleteUploadedFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      const { userId, containerName } = req.body;

      if (!fileId || !userId || !containerName) {
        res.status(400).json({
          success: false,
          error: 'File ID, user ID, and container name are required'
        } as ApiResponse<null>);
        return;
      }

      // Delete from Azure Storage
      await this.storageService.deleteFile(containerName, fileId);

      // Update database record
      await this.cosmosService.markFileAsDeleted(fileId, userId);

      res.json({
        success: true,
        data: {
          fileId,
          deleted: true,
          deletedAt: new Date()
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in deleteUploadedFile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete uploaded file'
      } as ApiResponse<null>);
    }
  };

  /**
   * Get processing status for batch or individual operations
   */
  public getProcessingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { operationId } = req.params;
      const { userId } = req.query;

      if (!operationId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Operation ID and user ID are required'
        } as ApiResponse<null>);
        return;
      }

      const status = await this.cosmosService.getProcessingStatus(operationId, userId as string);

      if (!status) {
        res.status(404).json({
          success: false,
          error: 'Operation not found'
        } as ApiResponse<null>);
        return;
      }

      res.json({
        success: true,
        data: status
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in getProcessingStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get processing status'
      } as ApiResponse<null>);
    }
  };
}
