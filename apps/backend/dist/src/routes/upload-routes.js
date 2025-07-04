import { Router } from 'express';
import { UploadController } from '../controllers/upload-controller.js';
import multer from 'multer';
const router = Router();
const uploadController = new UploadController();
// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images and common document formats
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
            'image/tiff',
            'application/pdf',
            'text/plain'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only images, PDF, and text files are allowed.'));
        }
    }
});
/**
 * @route POST /api/v1/upload/image
 * @desc Upload single image
 * @access Public
 */
router.post('/image', upload.single('file'), uploadController.uploadImage);
/**
 * @route POST /api/v1/upload/drawing
 * @desc Upload and process drawing
 * @access Public
 */
router.post('/drawing', upload.single('file'), uploadController.uploadDrawing);
/**
 * @route POST /api/v1/upload/extract-text
 * @desc Extract text from uploaded image using OCR
 * @access Public
 */
router.post('/extract-text', uploadController.extractTextFromImage);
/**
 * @route POST /api/v1/upload/recognize-cards
 * @desc Recognize cards from uploaded image
 * @access Public
 */
router.post('/recognize-cards', uploadController.recognizeCardsFromImage);
/**
 * @route POST /api/v1/upload/analyze-deck-photo
 * @desc Analyze deck photo (comprehensive analysis)
 * @access Public
 */
router.post('/analyze-deck-photo', uploadController.analyzeDeckPhoto);
/**
 * @route POST /api/v1/upload/batch-process
 * @desc Batch process multiple images
 * @access Public
 */
router.post('/batch-process', uploadController.batchProcessImages);
/**
 * @route GET /api/v1/upload/history/:userId
 * @desc Get upload history for user
 * @access Public
 */
router.get('/history/:userId', uploadController.getUploadHistory);
/**
 * @route DELETE /api/v1/upload/file/:fileId
 * @desc Delete uploaded file
 * @access Public
 */
router.delete('/file/:fileId', uploadController.deleteUploadedFile);
/**
 * @route GET /api/v1/upload/status/:operationId
 * @desc Get processing status for batch or individual operations
 * @access Public
 */
router.get('/status/:operationId', uploadController.getProcessingStatus);
export default router;
//# sourceMappingURL=upload-routes.js.map