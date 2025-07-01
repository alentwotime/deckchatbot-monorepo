import express from 'express';
import { chatbot, validate } from '../controllers/chatbotController.js';

// Child routers
import multishapeRoutes from './multishape.js';
import measurementsRoutes from './measurements.js';
import skirtingRoutes from './skirting.js';
import deckCalcRoutes from './deckCalc.js';
import digitalizeRoutes from './digitalize.js';
import uploadDrawingRoutes from './uploadDrawing.js';
import stepsRoutes from './steps.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Primary endpoints
router.post('/chatbot', validate, chatbot);
router.use('/calculate-multi-shape', multishapeRoutes);
router.use('/upload-measurements', measurementsRoutes);
router.use('/calculate-skirting', skirtingRoutes);
router.use('/calculate-deck-materials', deckCalcRoutes);
router.use('/digitalize-drawing', digitalizeRoutes);
router.use('/upload-drawing', uploadDrawingRoutes);
router.use('/calculate-steps', stepsRoutes);

export default router;
