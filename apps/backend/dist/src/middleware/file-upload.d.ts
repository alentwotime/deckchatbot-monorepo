import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
declare const SUPPORTED_IMAGE_TYPES: string[];
declare const FILE_SIZE_LIMITS: {
    image: number;
    document: number;
    general: number;
};
declare const UPLOAD_DIRS: {
    images: string;
    documents: string;
    temp: string;
    processed: string;
};
export declare const uploadImage: multer.Multer;
export declare const uploadMultipleImages: multer.Multer;
export declare const uploadTemp: multer.Multer;
export declare const uploadToMemory: multer.Multer;
interface OptimizationOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    progressive?: boolean;
}
export declare const optimizeImage: (options?: OptimizationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateFile: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateMultipleFiles: (req: Request, res: Response, next: NextFunction) => void;
export declare const extractImageMetadata: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const cleanupTempFiles: (req: Request, res: Response, next: NextFunction) => void;
export declare const handleUploadError: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const getFileInfo: (file: Express.Multer.File) => {
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
};
export declare const deleteUploadedFile: (filePath: string) => Promise<void>;
export { UPLOAD_DIRS, FILE_SIZE_LIMITS, SUPPORTED_IMAGE_TYPES };
declare global {
    namespace Express {
        interface Request {
            imageMetadata?: {
                width?: number;
                height?: number;
                format?: string;
                size: number;
                density?: number;
                hasAlpha?: boolean;
                orientation?: number;
            };
        }
    }
}
//# sourceMappingURL=file-upload.d.ts.map