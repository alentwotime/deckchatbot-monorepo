import express from 'express';
import multer from 'multer';
import { uploadDrawing } from '../controllers/drawingUploadController.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    // Allow all files - validation will be done in the controller
    // This gives us more control over error messages
    cb(null, true);
  }
});

// Handle file upload with proper error handling
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File size too large. Maximum allowed size is 50MB.' 
        });
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          error: 'Too many files. Please upload only one file at a time.' 
        });
      } else {
        return res.status(400).json({ 
          error: 'File upload error: ' + err.message 
        });
      }
    } else if (err) {
      return res.status(500).json({ 
        error: 'Server error during file upload.' 
      });
    }

    // If no error, proceed to the controller
    next();
  });
}, uploadDrawing);

export default router;
