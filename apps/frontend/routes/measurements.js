import express from 'express';
import multer from 'multer';
import { uploadMeasurements } from '../controllers/measurementController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Just check file in the controller instead
router.post('/', upload.single('image'), uploadMeasurements);

export default router;
