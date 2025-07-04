const Tesseract = require('tesseract.js');
const { addMeasurement } = require('../memory');
const { polygonArea, calculatePerimeter, ftInToDecimal } = require('../src/utils/geometry');
const { ftIn } = require('../src/utils/skirting');
const logger = require('../src/utils/logger');

/**
 * Extract measurements from uploaded images using OCR
 */
async function uploadMeasurements(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        errors: [{ msg: 'Image file is required' }]
      });
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
      .filter(n => !isNaN(n) && n >= 0 && n <= 500); // Allow zero values

    const needsSkirting = /skirting|skirt|underdeck/i.test(text);
    if (numbers.length < 8 && !needsSkirting) {
      return res.status(400).json({
        errors: [{ msg: 'Not enough measurements found in the image.' }]
      });
    }

    logger.info('Numbers extracted from image:', { numbers });

    // Determine if this includes a pool cutout
    const hasPool = /pool|cutout|spa|hot tub/i.test(text);
    const midpoint = hasPool ? Math.floor(numbers.length / 2) : numbers.length;

    // Create coordinate points for the main deck area
    const outerPoints = [];
    for (let i = 0; i < midpoint; i += 2) {
      if (i + 1 < midpoint) {
        outerPoints.push({
          x: numbers[i],
          y: numbers[i + 1]
        });
      }
    }

    // Calculate deck area
    let outerDeckArea = 0;
    let poolArea = 0;

    if (outerPoints.length >= 3) {
      outerDeckArea = polygonArea(outerPoints);
    } else if (outerPoints.length === 2) {
      // Assume rectangle
      outerDeckArea = outerPoints[0].x * outerPoints[0].y;
    }

    // Handle pool cutout if present
    if (hasPool && numbers.length > midpoint) {
      const poolPoints = [];
      for (let i = midpoint; i < numbers.length; i += 2) {
        if (i + 1 < numbers.length) {
          poolPoints.push({
            x: numbers[i],
            y: numbers[i + 1]
          });
        }
      }

      if (poolPoints.length >= 3) {
        poolArea = polygonArea(poolPoints);
      } else if (poolPoints.length === 2) {
        poolArea = poolPoints[0].x * poolPoints[0].y;
      }
    }

    let usableDeckArea = outerDeckArea - poolArea;
    let perimeter = outerPoints.length >= 3 ? calculatePerimeter(outerPoints) : 0;

    // Check for skirting request
    let skirting = null;

    if (needsSkirting) {
      const materialMatch = text.match(/(PVC|Composite|Mineral Board)/i);
      const [len, wid, hRaw] = numbers;
      const height = hRaw > 12 ? hRaw / 12 : hRaw;
      const perim = 2 * (len + wid);
      perimeter = perim;
      usableDeckArea = len * wid;

      skirting = {
        perimeter: ftIn(perim),
        height: height.toFixed(2),
        panelsNeeded: Math.ceil((perim * height) / 32),
        material: materialMatch ? materialMatch[1] : 'PVC'
      };
    }

    let explanation = `Calculated from ${outerPoints.length} points.`;
    if (!hasPool && outerPoints.length === 4) {
      explanation = 'simple deck with no cutouts';
    } else if (hasPool) {
      explanation += ' Pool area subtracted.';
    }

    const result = {
      outerDeckArea: outerDeckArea.toFixed(2),
      poolArea: poolArea.toFixed(2),
      usableDeckArea: usableDeckArea.toFixed(2),
      railingFootage: perimeter.toFixed(2),
      fasciaBoardLength: perimeter.toFixed(2),
      warning: usableDeckArea > 1000 ? 'Large deck area detected. Please verify measurements.' : null,
      explanation
    };
    if (skirting) {
      Object.assign(result, skirting);
    }

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
