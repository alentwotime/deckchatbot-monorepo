const { parseMeasurement } = require('../utils/extract');
const { calculateSkirtingMetrics, ftIn } = require('../utils/skirting');

function toFeetDecimal(feet, inches) {
  return parseFloat(feet) + parseFloat(inches || 0) / 12;
}

// Allow a single value like "10' 6\"" or 10.5 to be converted to feet
function normalizeMeasurement(ft, inch, combined) {
  if (combined != null) {
    const parsed = parseMeasurement(String(combined));
    if (typeof parsed === 'number' && !Number.isNaN(parsed)) {
      return parsed;
    }
  }
  if (ft != null) {
    return toFeetDecimal(ft, inch);
  }
  return null;
}

function calculateSkirting(req, res) {
  const {
    length,
    lengthFt,
    lengthIn = 0,
    width,
    widthFt,
    widthIn = 0,
    height,
    heightFt,
    heightIn = 0,
    sides = 4,
    material
  } = req.body;

  // Validate parameter types
  if (
    (length != null && typeof length !== 'string') ||
    (lengthFt != null && typeof lengthFt !== 'string' && typeof lengthFt !== 'number') ||
    (lengthIn != null && typeof lengthIn !== 'number') ||
    (width != null && typeof width !== 'string') ||
    (widthFt != null && typeof widthFt !== 'string' && typeof widthFt !== 'number') ||
    (widthIn != null && typeof widthIn !== 'number') ||
    (height != null && typeof height !== 'string') ||
    (heightFt != null && typeof heightFt !== 'string' && typeof heightFt !== 'number') ||
    (heightIn != null && typeof heightIn !== 'number') ||
    (typeof sides !== 'number' || ![3, 4].includes(sides)) ||
    (material == null || typeof material !== 'string')
  ) {
    return res.status(400).json({
      errors: [{ msg: 'Invalid parameter types. Ensure all inputs are correctly formatted.' }]
    });
  }

  const lengthVal = normalizeMeasurement(lengthFt, lengthIn, length);
  const widthVal = normalizeMeasurement(widthFt, widthIn, width);
  const heightVal = normalizeMeasurement(heightFt, heightIn, height);

  if (
    lengthVal == null ||
    widthVal == null ||
    heightVal == null ||
    !material ||
    ![3, 4].includes(Number(sides))
  ) {
    return res.status(400).json({
      errors: [{ msg: 'length, width, height and material are required. Sides must be 3 or 4.' }]
    });
  }

  const lengthFeet = lengthVal;
  const widthFeet = widthVal;
  const heightFeet = heightVal;

  const result = calculateSkirtingMetrics({
    length: lengthFeet,
    width: widthFeet,
    height: heightFeet,
    sides,
    material
  });

  res.json({
    perimeter: ftIn(result.perimeter),
    skirtingArea: result.skirtingArea.toFixed(2),
    panelsNeeded: result.panelsNeeded,
    material: result.material,
    tip: result.tip,
    note: result.note
  });
}

module.exports = { calculateSkirting };
