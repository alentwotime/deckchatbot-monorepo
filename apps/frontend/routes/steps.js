const express = require('express');
const { calculateStepsEndpoint } = require('../controllers/stepsController');

const router = express.Router();

router.post('/', calculateStepsEndpoint);

module.exports = router;
