const express = require('express');
const { chatbot, validate } = require('../controllers/chatbotController');

// Child routers
const multishapeRoutes = require('./multishape');
const measurementsRoutes = require('./measurements');
const skirtingRoutes = require('./skirting');
const deckCalcRoutes = require('./deckCalc');
const digitalizeRoutes = require('./digitalize');
const uploadDrawingRoutes = require('./uploadDrawing');
const stepsRoutes = require('./steps');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: require('../package.json').version
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

module.exports = router;
