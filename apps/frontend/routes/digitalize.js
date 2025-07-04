import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { digitalizeDrawing } from '../controllers/digitalizeController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 🧪 Validation: Ensure image file exists
const validateImage = [
  body('image').custom((_, { req }) => {
    if (!req.file) {
      throw new Error('Image file is required');
    }
    return true;
  })
];

// POST /digitalize-drawing
router.post('/', upload.single('image'), digitalizeDrawing);

export default router;
