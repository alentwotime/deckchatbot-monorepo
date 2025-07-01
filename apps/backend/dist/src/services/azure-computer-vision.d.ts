/**
 * Azure Computer Vision Service
 * Image processing service for OCR, card recognition, and deck analysis
 */
export interface DeckBlueprint {
    id?: string;
    userId: string;
    name: string;
    description?: string;
    imageUrl: string;
    recognizedCards: RecognizedCard[];
    layout: {
        width: number;
        height: number;
        cardPositions: CardPosition[];
        gridType: 'manual' | 'auto' | 'custom';
    };
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        confidence: number;
        processingTime: number;
        source: 'drawing' | 'photo' | 'scan' | 'digital';
    };
    settings: BlueprintSettings;
    analysis?: DeckBlueprintAnalysis;
}
export interface UploadedImage {
    id: string;
    userId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    uploadedAt: Date;
    metadata: {
        width: number;
        height: number;
        format: string;
        colorSpace: string;
        hasAlpha: boolean;
    };
    processing: {
        status: 'pending' | 'processing' | 'completed' | 'failed';
        progress: number;
        startedAt?: Date;
        completedAt?: Date;
        error?: string;
    };
    analysis?: ImageAnalysisResult;
}
export interface DeckVisualization {
    id?: string;
    deckId: string;
    userId: string;
    type: '2d' | '3d' | 'ar' | 'blueprint';
    config: VisualizationConfig;
    assets: {
        images: string[];
        models: string[];
        textures: string[];
        animations: string[];
    };
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        renderTime: number;
        quality: 'low' | 'medium' | 'high' | 'ultra';
    };
    settings: VisualizationSettings;
}
export interface RecognizedCard {
    name: string;
    confidence: number;
    quantity?: number;
    set?: string;
    rarity?: string;
    manaCost?: string;
    type?: string;
    boundingBox: BoundingBox;
    alternativeMatches?: {
        name: string;
        confidence: number;
    }[];
    metadata: {
        recognitionMethod: 'ocr' | 'image' | 'hybrid';
        processingTime: number;
        verified: boolean;
    };
}
export interface CardPosition {
    cardId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    zIndex: number;
    category: 'mainboard' | 'sideboard' | 'commander' | 'token';
}
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface BlueprintSettings {
    recognition: {
        enableOCR: boolean;
        enableImageMatching: boolean;
        confidenceThreshold: number;
        maxAlternatives: number;
        autoCorrect: boolean;
    };
    layout: {
        autoArrange: boolean;
        snapToGrid: boolean;
        gridSize: number;
        allowOverlap: boolean;
        maintainAspectRatio: boolean;
    };
    processing: {
        enhanceImage: boolean;
        removeBackground: boolean;
        adjustContrast: boolean;
        sharpenText: boolean;
    };
}
export interface DeckBlueprintAnalysis {
    totalCards: number;
    recognizedCards: number;
    confidence: number;
    suggestions: string[];
    issues: {
        type: 'duplicate' | 'unrecognized' | 'low_confidence' | 'missing';
        description: string;
        cards: string[];
    }[];
    statistics: {
        averageConfidence: number;
        processingTime: number;
        recognitionRate: number;
    };
}
export interface ImageAnalysisResult {
    objects: DetectedObject[];
    text: ExtractedText[];
    faces: DetectedFace[];
    colors: ColorAnalysis;
    categories: ImageCategory[];
    tags: ImageTag[];
    description: string;
    metadata: {
        width: number;
        height: number;
        format: string;
        analysisTime: number;
    };
}
export interface DetectedObject {
    name: string;
    confidence: number;
    boundingBox: BoundingBox;
    parent?: string;
    properties?: Record<string, any>;
}
export interface ExtractedText {
    text: string;
    confidence: number;
    boundingBox: BoundingBox;
    language?: string;
    angle?: number;
    handwritten?: boolean;
}
export interface DetectedFace {
    age?: number;
    gender?: 'male' | 'female';
    boundingBox: BoundingBox;
    landmarks?: FaceLandmark[];
    attributes?: FaceAttributes;
}
export interface FaceLandmark {
    type: string;
    x: number;
    y: number;
}
export interface FaceAttributes {
    smile?: number;
    headPose?: {
        pitch: number;
        roll: number;
        yaw: number;
    };
    emotion?: {
        anger: number;
        contempt: number;
        disgust: number;
        fear: number;
        happiness: number;
        neutral: number;
        sadness: number;
        surprise: number;
    };
}
export interface ColorAnalysis {
    dominantColors: string[];
    accentColor: string;
    isBWImg: boolean;
    foregroundColor: string;
    backgroundColor: string;
}
export interface ImageCategory {
    name: string;
    score: number;
    detail?: {
        celebrities?: any[];
        landmarks?: any[];
    };
}
export interface ImageTag {
    name: string;
    confidence: number;
    hint?: string;
}
export interface VisualizationConfig {
    camera: {
        position: {
            x: number;
            y: number;
            z: number;
        };
        target: {
            x: number;
            y: number;
            z: number;
        };
        fov: number;
        near: number;
        far: number;
    };
    lighting: {
        ambient: {
            color: string;
            intensity: number;
        };
        directional: {
            color: string;
            intensity: number;
            direction: {
                x: number;
                y: number;
                z: number;
            };
        };
        shadows: boolean;
    };
    materials: {
        cardMaterial: string;
        tableMaterial: string;
        backgroundMaterial: string;
    };
    effects: {
        bloom: boolean;
        antialiasing: boolean;
        reflections: boolean;
        particles: boolean;
    };
}
export interface VisualizationSettings {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    performance: {
        targetFPS: number;
        adaptiveQuality: boolean;
        levelOfDetail: boolean;
    };
    interaction: {
        enableZoom: boolean;
        enableRotation: boolean;
        enablePanning: boolean;
        enableSelection: boolean;
    };
    animation: {
        cardFlip: boolean;
        hoverEffects: boolean;
        transitionSpeed: number;
        easing: string;
    };
}
export interface OCRRequest {
    imageUrl?: string;
    imageBuffer?: Buffer;
    language?: string;
    detectOrientation?: boolean;
    options?: {
        enhanceImage?: boolean;
        removeBackground?: boolean;
        adjustContrast?: boolean;
    };
}
export interface OCRResponse {
    text: string;
    confidence: number;
    regions: TextRegion[];
    language: string;
    orientation: number;
    processingTime: number;
}
export interface TextRegion {
    boundingBox: BoundingBox;
    lines: TextLine[];
}
export interface TextLine {
    boundingBox: BoundingBox;
    words: TextWord[];
    text: string;
}
export interface TextWord {
    boundingBox: BoundingBox;
    text: string;
    confidence: number;
}
export interface CardRecognitionRequest {
    imageUrl?: string;
    imageBuffer?: Buffer;
    options?: {
        enableOCR?: boolean;
        enableImageMatching?: boolean;
        confidenceThreshold?: number;
        maxResults?: number;
        format?: string;
    };
}
export interface CardRecognitionResponse {
    cards: RecognizedCard[];
    totalFound: number;
    processingTime: number;
    confidence: number;
    metadata: {
        imageSize: {
            width: number;
            height: number;
        };
        recognitionMethod: 'ocr' | 'image' | 'hybrid';
        enhancementsApplied: string[];
    };
}
export interface ImageAnalysisRequest {
    imageUrl?: string;
    imageBuffer?: Buffer;
    features: ('objects' | 'text' | 'faces' | 'colors' | 'categories' | 'tags' | 'description')[];
    options?: {
        language?: string;
        maxCandidates?: number;
        includeDetails?: boolean;
    };
}
export interface DeckPhotoAnalysisRequest {
    imageUrl?: string;
    imageBuffer?: Buffer;
    deckFormat?: string;
    options?: {
        autoRotate?: boolean;
        enhanceQuality?: boolean;
        detectLayout?: boolean;
        groupCards?: boolean;
    };
}
export interface DeckPhotoAnalysisResponse {
    blueprint: DeckBlueprint;
    cards: RecognizedCard[];
    layout: {
        detected: boolean;
        type: 'grid' | 'pile' | 'spread' | 'mixed';
        confidence: number;
    };
    suggestions: string[];
    processingTime: number;
}
declare class AzureComputerVisionService {
    private static instance;
    private client;
    private config;
    private initialized;
    private constructor();
    static getInstance(): AzureComputerVisionService;
    /**
     * Initialize Computer Vision client
     */
    private initializeClient;
    /**
     * Extract text from image using OCR
     */
    extractText(request: OCRRequest): Promise<OCRResponse>;
    /**
     * Recognize Magic: The Gathering cards from image
     */
    recognizeCards(request: CardRecognitionRequest): Promise<CardRecognitionResponse>;
    /**
     * Analyze deck photo and create blueprint
     */
    analyzeDeckPhoto(request: DeckPhotoAnalysisRequest): Promise<DeckPhotoAnalysisResponse>;
    /**
     * Perform comprehensive image analysis
     */
    analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult>;
    /**
     * Parse Magic: The Gathering card names from text
     */
    private parseCardsFromText;
    /**
     * Health check for the service
     */
    healthCheck(): Promise<{
        status: string;
        configured: boolean;
        error?: string;
    }>;
}
export declare const azureComputerVision: AzureComputerVisionService;
export default azureComputerVision;
//# sourceMappingURL=azure-computer-vision.d.ts.map