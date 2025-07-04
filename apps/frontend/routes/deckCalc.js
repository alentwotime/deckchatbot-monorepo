import express from 'express';
import { calculateDeckMaterials } from '../controllers/deckCalcController.js';

const router = express.Router();

router.post('/', calculateDeckMaterials);

export default router;
