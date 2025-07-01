import express from 'express';
import { calculateStepsEndpoint } from '../controllers/stepsController.js';

const router = express.Router();

router.post('/', calculateStepsEndpoint);

export default router;
