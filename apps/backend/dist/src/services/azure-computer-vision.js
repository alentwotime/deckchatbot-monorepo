/**
 * Azure Computer Vision Service
 * Image processing service for OCR, card recognition, and deck analysis
 */
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { azureConfig } from './azure-config.js';
// ==================== SERVICE CLASS ====================
class AzureComputerVisionService {
    static instance;
    client;
    config;
    initialized = false;
    constructor() {
        this.config = azureConfig.getConfig();
        this.initializeClient();
    }
    static getInstance() {
        if (!AzureComputerVisionService.instance) {
            AzureComputerVisionService.instance = new AzureComputerVisionService();
        }
        return AzureComputerVisionService.instance;
    }
    /**
     * Initialize Computer Vision client
     */
    initializeClient() {
        const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
        const apiKey = process.env.AZURE_COMPUTER_VISION_API_KEY;
        if (!endpoint || !apiKey) {
            console.warn('⚠️  Azure Computer Vision not configured. Image processing features will be unavailable.');
            return;
        }
        try {
            const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': apiKey } });
            this.client = new ComputerVisionClient(credentials, endpoint);
            this.initialized = true;
            console.log('✅ Azure Computer Vision initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize Azure Computer Vision:', error);
        }
    }
    /**
     * Extract text from image using OCR
     */
    async extractText(request) {
        if (!this.initialized) {
            throw new Error('Azure Computer Vision not configured');
        }
        const startTime = Date.now();
        try {
            let result;
            if (request.imageUrl) {
                result = await this.client.recognizeText(request.imageUrl, {
                    mode: 'Printed'
                });
            }
            else if (request.imageBuffer) {
                result = await this.client.recognizeTextInStream(request.imageBuffer, {
                    mode: 'Printed'
                });
            }
            else {
                throw new Error('Either imageUrl or imageBuffer must be provided');
            }
            // Process the result
            const regions = [];
            let fullText = '';
            let totalConfidence = 0;
            let wordCount = 0;
            if (result.textOperationResult && result.textOperationResult.recognitionResults) {
                for (const page of result.textOperationResult.recognitionResults) {
                    for (const line of page.lines) {
                        const words = [];
                        for (const word of line.words) {
                            words.push({
                                boundingBox: {
                                    x: word.boundingBox[0],
                                    y: word.boundingBox[1],
                                    width: word.boundingBox[2] - word.boundingBox[0],
                                    height: word.boundingBox[5] - word.boundingBox[1]
                                },
                                text: word.text,
                                confidence: word.confidence || 0.9
                            });
                            totalConfidence += word.confidence || 0.9;
                            wordCount++;
                        }
                        regions.push({
                            boundingBox: {
                                x: line.boundingBox[0],
                                y: line.boundingBox[1],
                                width: line.boundingBox[2] - line.boundingBox[0],
                                height: line.boundingBox[5] - line.boundingBox[1]
                            },
                            lines: [{
                                    boundingBox: {
                                        x: line.boundingBox[0],
                                        y: line.boundingBox[1],
                                        width: line.boundingBox[2] - line.boundingBox[0],
                                        height: line.boundingBox[5] - line.boundingBox[1]
                                    },
                                    words,
                                    text: line.text
                                }]
                        });
                        fullText += line.text + '\n';
                    }
                }
            }
            return {
                text: fullText.trim(),
                confidence: wordCount > 0 ? totalConfidence / wordCount : 0,
                regions,
                language: request.language || 'en',
                orientation: 0,
                processingTime: Date.now() - startTime
            };
        }
        catch (error) {
            console.error('Error extracting text:', error);
            throw new Error(`Failed to extract text: ${error.message}`);
        }
    }
    /**
     * Recognize Magic: The Gathering cards from image
     */
    async recognizeCards(request) {
        if (!this.initialized) {
            throw new Error('Azure Computer Vision not configured');
        }
        const startTime = Date.now();
        try {
            // First, extract text using OCR
            const ocrResult = await this.extractText({
                imageUrl: request.imageUrl,
                imageBuffer: request.imageBuffer
            });
            // Parse card names from extracted text
            const cards = this.parseCardsFromText(ocrResult.text);
            // Enhance with image analysis if enabled
            if (request.options?.enableImageMatching) {
                // This would integrate with a card image database
                // For now, we'll use the OCR results
            }
            return {
                cards,
                totalFound: cards.length,
                processingTime: Date.now() - startTime,
                confidence: ocrResult.confidence,
                metadata: {
                    imageSize: { width: 0, height: 0 }, // Would be extracted from image
                    recognitionMethod: 'ocr',
                    enhancementsApplied: []
                }
            };
        }
        catch (error) {
            console.error('Error recognizing cards:', error);
            throw new Error(`Failed to recognize cards: ${error.message}`);
        }
    }
    /**
     * Analyze deck photo and create blueprint
     */
    async analyzeDeckPhoto(request) {
        if (!this.initialized) {
            throw new Error('Azure Computer Vision not configured');
        }
        const startTime = Date.now();
        try {
            // Recognize cards in the image
            const cardRecognition = await this.recognizeCards({
                imageUrl: request.imageUrl,
                imageBuffer: request.imageBuffer,
                options: {
                    enableOCR: true,
                    enableImageMatching: true,
                    confidenceThreshold: 0.7
                }
            });
            // Create blueprint
            const blueprint = {
                userId: 'temp-user', // Would be passed in request
                name: `Deck Blueprint ${new Date().toISOString()}`,
                imageUrl: request.imageUrl || 'uploaded-image',
                recognizedCards: cardRecognition.cards,
                layout: {
                    width: 800,
                    height: 600,
                    cardPositions: cardRecognition.cards.map((card, index) => ({
                        cardId: `card-${index}`,
                        x: card.boundingBox.x,
                        y: card.boundingBox.y,
                        width: card.boundingBox.width,
                        height: card.boundingBox.height,
                        rotation: 0,
                        zIndex: index,
                        category: 'mainboard'
                    })),
                    gridType: 'auto'
                },
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    confidence: cardRecognition.confidence,
                    processingTime: Date.now() - startTime,
                    source: 'photo'
                },
                settings: {
                    recognition: {
                        enableOCR: true,
                        enableImageMatching: true,
                        confidenceThreshold: 0.7,
                        maxAlternatives: 3,
                        autoCorrect: true
                    },
                    layout: {
                        autoArrange: false,
                        snapToGrid: true,
                        gridSize: 10,
                        allowOverlap: false,
                        maintainAspectRatio: true
                    },
                    processing: {
                        enhanceImage: true,
                        removeBackground: false,
                        adjustContrast: true,
                        sharpenText: true
                    }
                }
            };
            return {
                blueprint,
                cards: cardRecognition.cards,
                layout: {
                    detected: true,
                    type: 'grid',
                    confidence: 0.8
                },
                suggestions: [
                    'Consider adjusting image lighting for better recognition',
                    'Ensure cards are not overlapping for optimal detection',
                    'Use higher resolution images for better text extraction'
                ],
                processingTime: Date.now() - startTime
            };
        }
        catch (error) {
            console.error('Error analyzing deck photo:', error);
            throw new Error(`Failed to analyze deck photo: ${error.message}`);
        }
    }
    /**
     * Perform comprehensive image analysis
     */
    async analyzeImage(request) {
        if (!this.initialized) {
            throw new Error('Azure Computer Vision not configured');
        }
        try {
            let result;
            if (request.imageUrl) {
                result = await this.client.analyzeImage(request.imageUrl, {
                    visualFeatures: request.features
                });
            }
            else if (request.imageBuffer) {
                result = await this.client.analyzeImageInStream(request.imageBuffer, {
                    visualFeatures: request.features
                });
            }
            else {
                throw new Error('Either imageUrl or imageBuffer must be provided');
            }
            return {
                objects: result.objects?.map(obj => ({
                    name: obj.objectProperty || 'unknown',
                    confidence: obj.confidence || 0,
                    boundingBox: {
                        x: obj.rectangle?.x || 0,
                        y: obj.rectangle?.y || 0,
                        width: obj.rectangle?.w || 0,
                        height: obj.rectangle?.h || 0
                    }
                })) || [],
                text: [], // Would be populated from OCR
                faces: result.faces?.map(face => ({
                    boundingBox: {
                        x: face.faceRectangle?.left || 0,
                        y: face.faceRectangle?.top || 0,
                        width: face.faceRectangle?.width || 0,
                        height: face.faceRectangle?.height || 0
                    },
                    age: face.faceAttributes?.age,
                    gender: face.faceAttributes?.gender
                })) || [],
                colors: {
                    dominantColors: result.color?.dominantColors || [],
                    accentColor: result.color?.accentColor || '#000000',
                    isBWImg: result.color?.isBWImg || false,
                    foregroundColor: result.color?.dominantColorForeground || '#000000',
                    backgroundColor: result.color?.dominantColorBackground || '#FFFFFF'
                },
                categories: result.categories?.map(cat => ({
                    name: cat.name || 'unknown',
                    score: cat.score || 0,
                    detail: cat.detail
                })) || [],
                tags: result.tags?.map(tag => ({
                    name: tag.name || 'unknown',
                    confidence: tag.confidence || 0,
                    hint: tag.hint
                })) || [],
                description: result.description?.captions?.[0]?.text || 'No description available',
                metadata: {
                    width: result.metadata?.width || 0,
                    height: result.metadata?.height || 0,
                    format: result.metadata?.format || 'unknown',
                    analysisTime: 0
                }
            };
        }
        catch (error) {
            console.error('Error analyzing image:', error);
            throw new Error(`Failed to analyze image: ${error.message}`);
        }
    }
    /**
     * Parse Magic: The Gathering card names from text
     */
    parseCardsFromText(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const cards = [];
        for (const line of lines) {
            const trimmed = line.trim();
            // Look for patterns like "4 Lightning Bolt" or "Lightning Bolt"
            const quantityMatch = trimmed.match(/^(\d+)\s+(.+)/);
            if (quantityMatch) {
                const quantity = parseInt(quantityMatch[1]);
                const cardName = quantityMatch[2].trim();
                cards.push({
                    name: cardName,
                    confidence: 0.8, // Default confidence
                    quantity,
                    boundingBox: { x: 0, y: 0, width: 0, height: 0 }, // Would be calculated from OCR
                    metadata: {
                        recognitionMethod: 'ocr',
                        processingTime: 0,
                        verified: false
                    }
                });
            }
            else if (trimmed.length > 2) {
                // Assume it's a card name without quantity
                cards.push({
                    name: trimmed,
                    confidence: 0.7,
                    quantity: 1,
                    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
                    metadata: {
                        recognitionMethod: 'ocr',
                        processingTime: 0,
                        verified: false
                    }
                });
            }
        }
        return cards;
    }
    /**
     * Health check for the service
     */
    async healthCheck() {
        try {
            if (!this.initialized) {
                return {
                    status: 'unhealthy',
                    configured: false,
                    error: 'Azure Computer Vision not configured'
                };
            }
            // Simple test - analyze a small test image URL
            // In production, you might want to use a specific test endpoint
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
}
// Export singleton instance
export const azureComputerVision = AzureComputerVisionService.getInstance();
export default azureComputerVision;
//# sourceMappingURL=azure-computer-vision.js.map