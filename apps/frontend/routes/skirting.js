import express from 'express';
import { calculateSkirting } from '../controllers/skirtingController.js';

const router = express.Router();

router.post('/', calculateSkirting);

export default router;
