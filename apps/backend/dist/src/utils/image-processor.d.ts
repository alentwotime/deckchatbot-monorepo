import { ImageProcessingOptions } from '../types/visual.js';
export interface ProcessedImage {
    buffer: Buffer;
    format: string;
    width: number;
    height: number;
    size: number;
    metadata?: any;
}
export interface OCRResult {
    text: string;
    confidence: number;
    words: Array<{
        text: string;
        confidence: number;
        bbox: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }>;
    lines: Array<{
        text: string;
        confidence: number;
        bbox: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }>;
}
export interface CardRecognitionResult {
    cardName?: string;
    setCode?: string;
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    features: {
        corners: Array<{
            x: number;
            y: number;
        }>;
        edges: Array<{
            start: {
                x: number;
                y: number;
            };
            end: {
                x: number;
                y: number;
            };
        }>;
        textRegions: Array<{
            x: number;
            y: number;
            width: number;
            height: number;
        }>;
    };
}
/**
 * Resize and optimize an image based on processing options
 */
export declare function resizeAndOptimizeImage(inputBuffer: Buffer, options: ImageProcessingOptions): Promise<ProcessedImage>;
/**
 * Convert image format
 */
export declare function convertImageFormat(inputBuffer: Buffer, targetFormat: 'jpeg' | 'png' | 'webp', quality?: number): Promise<ProcessedImage>;
/**
 * Extract metadata from image
 */
export declare function extractImageMetadata(inputBuffer: Buffer): Promise<any>;
/**
 * Extract text from image using OCR
 */
export declare function extractTextFromImage(inputBuffer: Buffer, options?: {
    language?: string;
    psm?: number;
    oem?: number;
}): Promise<OCRResult>;
/**
 * Preprocess image for better OCR results
 */
export declare function preprocessImageForOCR(inputBuffer: Buffer, options: ImageProcessingOptions): Promise<ProcessedImage>;
/**
 * Detect MTG card in image and extract card boundaries
 */
export declare function detectCardBoundaries(inputBuffer: Buffer): Promise<CardRecognitionResult>;
/**
 * Recognize MTG card from image using ML/AI
 */
export declare function recognizeCard(inputBuffer: Buffer, options?: {
    useOCR?: boolean;
    useVisualFeatures?: boolean;
    confidenceThreshold?: number;
}): Promise<CardRecognitionResult>;
/**
 * Validate image processing options
 */
export declare function validateProcessingOptions(options: ImageProcessingOptions): string[];
/**
 * Get optimal processing settings for card recognition
 */
export declare function getCardRecognitionSettings(): ImageProcessingOptions;
/**
 * Create thumbnail from image
 */
export declare function createThumbnail(inputBuffer: Buffer, size?: {
    width: number;
    height: number;
}): Promise<ProcessedImage>;
declare const _default: {
    resizeAndOptimizeImage: typeof resizeAndOptimizeImage;
    convertImageFormat: typeof convertImageFormat;
    extractImageMetadata: typeof extractImageMetadata;
    extractTextFromImage: typeof extractTextFromImage;
    preprocessImageForOCR: typeof preprocessImageForOCR;
    detectCardBoundaries: typeof detectCardBoundaries;
    recognizeCard: typeof recognizeCard;
    validateProcessingOptions: typeof validateProcessingOptions;
    getCardRecognitionSettings: typeof getCardRecognitionSettings;
    createThumbnail: typeof createThumbnail;
};
export default _default;
//# sourceMappingURL=image-processor.d.ts.map