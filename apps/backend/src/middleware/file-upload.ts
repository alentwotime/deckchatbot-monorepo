import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { createValidationError, createServerError } from './error-handler';

// Optional sharp import for image optimization
let sharp: any = null;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp not available - image optimization features will be disabled');
}

// Supported image types
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff'
];

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB for images
  document: 5 * 1024 * 1024, // 5MB for documents
  general: 2 * 1024 * 1024 // 2MB for general files
};

// Upload directories
const UPLOAD_DIRS = {
  images: 'uploads/images',
  documents: 'uploads/documents',
  temp: 'uploads/temp',
  processed: 'uploads/processed'
};

// Ensure upload directories exist
const ensureUploadDirs = (): void => {
  Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize upload directories
ensureUploadDirs();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  const isImage = SUPPORTED_IMAGE_TYPES.includes(file.mimetype);

  if (isImage) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${SUPPORTED_IMAGE_TYPES.join(', ')}`));
  }
};

// Storage configuration for images
const imageStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_DIRS.images);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for temporary uploads
const tempStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_DIRS.temp);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

// Memory storage for processing
const memoryStorage = multer.memoryStorage();

// Basic image upload configuration
export const uploadImage = multer({
  storage: imageStorage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 1
  }
});

// Multiple images upload configuration
export const uploadMultipleImages = multer({
  storage: imageStorage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 5 // Maximum 5 files
  }
});

// Temporary upload for processing
export const uploadTemp = multer({
  storage: tempStorage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 1
  }
});

// Memory upload for immediate processing
export const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 1
  }
});

// Image optimization options
interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
}

// Image optimization middleware
export const optimizeImage = (options: OptimizationOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        return next();
      }

      // Skip optimization if sharp is not available
      if (!sharp) {
        console.warn('Image optimization skipped - Sharp not available');
        return next();
      }

      const {
        width = 1920,
        height = 1080,
        quality = 80,
        format = 'jpeg',
        progressive = true
      } = options;

      const inputPath = req.file.path;
      const outputDir = UPLOAD_DIRS.processed;
      const outputFilename = `optimized-${Date.now()}-${Math.round(Math.random() * 1E9)}.${format}`;
      const outputPath = path.join(outputDir, outputFilename);

      // Optimize image using Sharp
      let sharpInstance = sharp(inputPath);

      // Resize if dimensions are specified
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Apply format-specific optimizations
      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality,
            progressive,
            mozjpeg: true
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            quality,
            progressive,
            compressionLevel: 9
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality,
            progressive
          });
          break;
      }

      // Save optimized image
      await sharpInstance.toFile(outputPath);

      // Update file information
      const stats = fs.statSync(outputPath);
      req.file.path = outputPath;
      req.file.filename = outputFilename;
      req.file.size = stats.size;

      // Clean up original file if it was temporary
      if (inputPath.includes('temp-')) {
        fs.unlinkSync(inputPath);
      }

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const serverError = createServerError(`Image optimization failed: ${errorMessage}`);
      next(serverError);
    }
  };
};

// File validation middleware
export const validateFile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    const error = createValidationError('No file uploaded');
    return next(error);
  }

  const file = req.file;

  // Validate file type
  if (!SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
    const error = createValidationError(
      `Unsupported file type: ${file.mimetype}. Supported types: ${SUPPORTED_IMAGE_TYPES.join(', ')}`
    );
    return next(error);
  }

  // Validate file size
  if (file.size > FILE_SIZE_LIMITS.image) {
    const error = createValidationError(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${FILE_SIZE_LIMITS.image / 1024 / 1024}MB`
    );
    return next(error);
  }

  // Validate file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    const error = createValidationError(
      `Invalid file extension: ${fileExtension}. Allowed extensions: ${allowedExtensions.join(', ')}`
    );
    return next(error);
  }

  next();
};

// Multiple files validation middleware
export const validateMultipleFiles = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    const error = createValidationError('No files uploaded');
    return next(error);
  }

  const files = req.files as Express.Multer.File[];

  // Validate each file
  for (const file of files) {
    // Validate file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
      const error = createValidationError(
        `Unsupported file type: ${file.mimetype} in file ${file.originalname}`
      );
      return next(error);
    }

    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.image) {
      const error = createValidationError(
        `File too large: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
      );
      return next(error);
    }
  }

  next();
};

// Image metadata extraction middleware
export const extractImageMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      return next();
    }

    // Skip metadata extraction if sharp is not available
    if (!sharp) {
      console.warn('Image metadata extraction skipped - Sharp not available');
      // Add basic metadata from file info
      req.imageMetadata = {
        size: req.file.size,
        format: path.extname(req.file.originalname).toLowerCase().slice(1)
      };
      return next();
    }

    const metadata = await sharp(req.file.path).metadata();

    // Add metadata to request object
    req.imageMetadata = {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: req.file.size,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    };

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const serverError = createServerError(`Failed to extract image metadata: ${errorMessage}`);
    next(serverError);
  }
};

// Clean up temporary files middleware
export const cleanupTempFiles = (req: Request, res: Response, next: NextFunction): void => {
  // Clean up temp files after response is sent
  res.on('finish', () => {
    if (req.file && req.file.path.includes('temp-')) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to cleanup temp file:', err);
      });
    }

    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        if (file.path.includes('temp-')) {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Failed to cleanup temp file:', err);
          });
        }
      });
    }
  });

  next();
};

// File upload error handler
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof multer.MulterError) {
    let message: string;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size: ${FILE_SIZE_LIMITS.image / 1024 / 1024}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = `Upload error: ${error.message}`;
    }

    const validationError = createValidationError(message);
    next(validationError);
  } else if (error.message.includes('Unsupported file type')) {
    const validationError = createValidationError(error.message);
    next(validationError);
  } else {
    next(error);
  }
};

// Utility function to get file info
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadedAt: new Date().toISOString()
  };
};

// Utility function to delete uploaded file
export const deleteUploadedFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Export upload directories for external use
export { UPLOAD_DIRS, FILE_SIZE_LIMITS, SUPPORTED_IMAGE_TYPES };

// Extend Express Request interface to include image metadata
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
