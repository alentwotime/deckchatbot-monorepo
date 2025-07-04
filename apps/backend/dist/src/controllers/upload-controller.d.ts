import { Request, Response } from 'express';
export declare class UploadController {
    private storageService;
    private visionService;
    private cosmosService;
    constructor();
    /**
     * Upload single image
     */
    uploadImage: (req: Request, res: Response) => Promise<void>;
    /**
     * Upload and process drawing
     */
    uploadDrawing: (req: Request, res: Response) => Promise<void>;
    /**
     * Extract text from uploaded image using OCR
     */
    extractTextFromImage: (req: Request, res: Response) => Promise<void>;
    /**
     * Recognize cards from uploaded image
     */
    recognizeCardsFromImage: (req: Request, res: Response) => Promise<void>;
    /**
     * Analyze deck photo (comprehensive analysis)
     */
    analyzeDeckPhoto: (req: Request, res: Response) => Promise<void>;
    /**
     * Batch process multiple images
     */
    batchProcessImages: (req: Request, res: Response) => Promise<void>;
    /**
     * Get upload history for user
     */
    getUploadHistory: (req: Request, res: Response) => Promise<void>;
    /**
     * Delete uploaded file
     */
    deleteUploadedFile: (req: Request, res: Response) => Promise<void>;
    /**
     * Get processing status for batch or individual operations
     */
    getProcessingStatus: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=upload-controller.d.ts.map