import express from 'express';
import { calculateMultiShape } from '../controllers/shapeController.js';

const router = express.Router();

router.post('/', calculateMultiShape);

export default router;
