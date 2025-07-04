import { Router } from 'express';
import { VisualizationController } from '../controllers/visualization-controller.js';

const router = Router();
const visualizationController = new VisualizationController();

/**
 * @route POST /api/v1/visualization/blueprint
 * @desc Generate deck blueprint visualization
 * @access Public
 */
router.post('/blueprint', visualizationController.generateDeckBlueprint);

/**
 * @route POST /api/v1/visualization/3d-model
 * @desc Create 3D deck model
 * @access Public
 */
router.post('/3d-model', visualizationController.create3DDeckModel);

/**
 * @route POST /api/v1/visualization/process-drawing
 * @desc Process uploaded drawing for deck visualization
 * @access Public
 */
router.post('/process-drawing', visualizationController.processUploadedDrawing);

/**
 * @route POST /api/v1/visualization/deck-statistics
 * @desc Generate deck statistics visualization
 * @access Public
 */
router.post('/deck-statistics', visualizationController.generateDeckStatisticsVisualization);

/**
 * @route GET /api/v1/visualization/history/:userId
 * @desc Get visualization history for user
 * @access Public
 */
router.get('/history/:userId', visualizationController.getVisualizationHistory);

/**
 * @route DELETE /api/v1/visualization/:visualizationId
 * @desc Delete visualization
 * @access Public
 */
router.delete('/:visualizationId', visualizationController.deleteVisualization);

export default router;
