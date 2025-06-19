const Tesseract = require('tesseract.js');
const { addMeasurement } = require('../memory');
const { polygonArea, calculatePerimeter } = require('../utils/geometry');
const { calculateSkirtingMetrics, ftIn } = require('../utils/skirting');
const logger = require('../utils/logger');

/**
 * Extract measurements from uploaded images using OCR
 */
async function uploadMeasurements(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ errors: [{ msg: 'Image file is required' }] });
    }

    logger.info('Processing measurement image', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Perform OCR on the uploaded image
    const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng', {
      logger: m => logger.debug('OCR progress:', m)
    });

    logger.debug('OCR text extracted:', { text });

    // Extract numbers from the OCR text
    const numberMatches = text.match(/\d+(?:\.\d+)?/g) || [];
    const numbers = numberMatches
      .map(n => parseFloat(n))
      .filter(n => !isNaN(n) && n >= 0 && n <= 500);

    const hasSkirting = /skirting|skirt|underdeck/i.test(text);

    if (hasSkirting && numbers.length >= 3) {
      const [length, width, rawHeight] = numbers;
      const height = rawHeight > 20 ? rawHeight / 12 : rawHeight;
      const result = calculateSkirtingMetrics({ length, width, height, material: /PVC/i.test(text) ? 'PVC' : 'Composite' });
      return res.json({
        perimeter: ftIn(result.perimeter),
        skirtingArea: result.skirtingArea.toFixed(2),
        panelsNeeded: result.panelsNeeded,
        material: result.material,
        note: result.note
      });
    }

    if (numbers.length < 8) {
      return res.status(400).json({
        errors: [{ msg: 'Not enough measurements found' }]
      });
    }

    logger.info('Numbers extracted from image:', { numbers });

    let outerDeckArea = 0;
    let perimeter = 0;

    if (numbers.length >= 8) {
      const pts = [];
      for (let i = 0; i < 8; i += 2) {
        pts.push({ x: numbers[i], y: numbers[i + 1] });
      }
      outerDeckArea = polygonArea(pts);
      perimeter = calculatePerimeter(pts);
    } else if (numbers.length >= 4) {
      const length = numbers[2] - numbers[0];
      const width = numbers[3] - numbers[1];
      outerDeckArea = Math.abs(length * width);
      perimeter = 2 * (Math.abs(length) + Math.abs(width));
    }

    const poolArea = 0;
    const usableDeckArea = outerDeckArea;

    let skirting = null;

    const result = {
      outerDeckArea: outerDeckArea.toFixed(2),
      poolArea: poolArea.toFixed(2),
      usableDeckArea: usableDeckArea.toFixed(2),
      railingFootage: perimeter.toFixed(2),
      fasciaBoardLength: perimeter.toFixed(2),
      warning: null,
      explanation: 'simple deck with no cutouts',
      ...(skirting || {})
    };

    // Save to memory
    addMeasurement(result);

    logger.info('Measurement extraction completed', result);

    res.json(result);
  } catch (error) {
    logger.error('Error processing measurements:', error);
    res.status(500).json({
      errors: [{ msg: 'Error processing image. Please try again with a clearer image.' }]
    });
  }
}

module.exports = {
  uploadMeasurements
};
