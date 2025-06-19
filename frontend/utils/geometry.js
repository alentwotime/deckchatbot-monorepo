const math = require('mathjs');

/**
 * Geometry utility functions for deck calculations
 */

/**
 * Calculate rectangle area
 * @param {number} length - Length of rectangle
 * @param {number} width - Width of rectangle
 * @returns {number} Area in square units
 */
function rectangleArea(length, width) {
  if (length <= 0 || width <= 0) {
    throw new Error('Length and width must be positive numbers');
  }
  return length * width;
}

/**
 * Calculate circle area
 * @param {number} radius - Radius of circle
 * @returns {number} Area in square units
 */
function circleArea(radius) {
  if (radius <= 0) {
    throw new Error('Radius must be a positive number');
  }
  return Math.PI * Math.pow(radius, 2);
}

/**
 * Calculate triangle area
 * @param {number} base - Base of triangle
 * @param {number} height - Height of triangle
 * @returns {number} Area in square units
 */
function triangleArea(base, height) {
  if (base <= 0 || height <= 0) {
    throw new Error('Base and height must be positive numbers');
  }
  return 0.5 * base * height;
}

/**
 * Calculate the area of an arbitrary polygon using the shoelace formula
 * @param {Array<{x:number,y:number}>} points - vertices of the polygon
 * @returns {number} The polygon area in square units
 */
function polygonArea(points) {
  if (!Array.isArray(points) || points.length < 3) {
    throw new Error('Polygon must have at least 3 points');
  }
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(sum / 2);
}

/**
 * Calculate the perimeter of a polygon
 * @param {Array<{x:number,y:number}>} points
 * @returns {number} perimeter length
 */
function calculatePerimeter(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return 0;
  }
  let perim = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const dx = points[i].x - points[j].x;
    const dy = points[i].y - points[j].y;
    perim += Math.sqrt(dx * dx + dy * dy);
  }
  return perim;
}

/**
 * Convert feet and inches string to decimal feet.
 * Accepts formats like "5' 6\"" or "5.5".
 * @param {string|number} value
 * @returns {number}
 */
function ftInToDecimal(value) {
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  if (/^\d+(?:\.\d+)?\s*\"$/.test(str) && !str.includes("'")) {
    return parseFloat(str) / 12;
  }
  const match = str.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft)?\s*(\d+(?:\.\d+)?)?\s*(?:\"|in)?$/i);
  if (!match) return parseFloat(str) || 0;
  const feet = parseFloat(match[1]);
  const inches = match[2] ? parseFloat(match[2]) : 0;
  return feet + inches / 12;
}

/**
 * Extract shape information from message
 * @param {string} message - User message
 * @returns {Object} Shape information
 */
function shapeFromMessage(message) {
  const msg = message.toLowerCase();

  // Look for rectangle patterns
  const rectMatch = msg.match(/rectangle|rectangular|deck/);
  if (rectMatch) {
    const dims = msg.match(/([\d'\"\.\s]+)\s*(?:x|by)\s*([\d'\"\.\s]+)/);
    if (dims) {
      return {
        type: 'rectangle',
        dimensions: {
          length: ftInToDecimal(dims[1]),
          width: ftInToDecimal(dims[2])
        }
      };
    }
  }

  // Look for circle patterns
  const circleMatch = msg.match(/circle|circular|round/);
  if (circleMatch) {
    const radiusMatch = msg.match(/radius[:\s]*(\d+(?:\.\d+)?(?:['\"])?\s*(\d+(?:\.\d+)?)?\"?)/);
    if (radiusMatch) {
      return {
        type: 'circle',
        dimensions: {
          radius: ftInToDecimal(radiusMatch[1])
        }
      };
    }
  }

  // Look for triangle patterns
  const triangleMatch = msg.match(/triangle|triangular/);
  if (triangleMatch) {
    const baseMatch = msg.match(/base[:\s]*(\d+(?:\.\d+)?)/);
    const heightMatch = msg.match(/height[:\s]*(\d+(?:\.\d+)?)/);
    
    if (baseMatch && heightMatch) {
      return {
        type: 'triangle',
        dimensions: {
          base: parseFloat(baseMatch[1]),
          height: parseFloat(heightMatch[1])
        }
      };
    }
  }

  return null;
}

/**
 * Generate deck area explanation
 * @param {Object} shape - Shape object with type and dimensions
 * @returns {string} Explanation text
 */
function deckAreaExplanation(shape) {
  if (!shape) {
    return 'I couldn\'t identify specific dimensions in your message.';
  }

  const { type, dimensions } = shape;
  let area, explanation;

  switch (type) {
    case 'rectangle':
      area = rectangleArea(dimensions.length, dimensions.width);
      explanation = `For a rectangular deck ${dimensions.length} × ${dimensions.width} feet:\n` +
                   `Area = Length × Width = ${dimensions.length} × ${dimensions.width} = ${area.toFixed(2)} square feet`;
      break;
    
    case 'circle':
      area = circleArea(dimensions.radius);
      explanation = `For a circular deck with radius ${dimensions.radius} feet:\n` +
                   `Area = π × r² = π × ${dimensions.radius}² = ${area.toFixed(2)} square feet`;
      break;
    
    case 'triangle':
      area = triangleArea(dimensions.base, dimensions.height);
      explanation = `For a triangular deck with base ${dimensions.base} and height ${dimensions.height} feet:\n` +
                   `Area = ½ × Base × Height = ½ × ${dimensions.base} × ${dimensions.height} = ${area.toFixed(2)} square feet`;
      break;
    
    default:
      return 'Unknown shape type.';
  }

  return explanation + `\n\nThis would require approximately ${Math.ceil(area / 100)} deck boards (assuming 100 sq ft coverage per board with waste factor).`;
}

/**
 * Calculate deck materials needed
 * @param {number} area - Total deck area in square feet
 * @param {Object} options - Material calculation options
 * @returns {Object} Material requirements
 */
function calculateMaterials(area, options = {}) {
  const {
    boardWidth = 5.5, // inches
    boardLength = 16, // feet
    wastePercentage = 10,
    joistsSpacing = 16, // inches on center
    beamSpacing = 8 // feet on center
  } = options;

  // Calculate board coverage area (accounting for actual vs nominal dimensions)
  const boardCoverage = (boardWidth / 12) * boardLength; // Convert width to feet
  const boardsNeeded = Math.ceil((area * (1 + wastePercentage / 100)) / boardCoverage);

  // Calculate structural materials (simplified)
  const perimeterEstimate = 2 * Math.sqrt(area * 2); // Rough perimeter estimate
  const joistsNeeded = Math.ceil(perimeterEstimate * 12 / joistsSpacing);
  const beamsNeeded = Math.ceil(Math.sqrt(area) / beamSpacing);

  return {
    deckBoards: boardsNeeded,
    joists: joistsNeeded,
    beams: beamsNeeded,
    area: area,
    wastePercentage: wastePercentage
  };
}

module.exports = {
  rectangleArea,
  circleArea,
  triangleArea,
  polygonArea,
  calculatePerimeter,
  ftInToDecimal,
  shapeFromMessage,
  deckAreaExplanation,
  calculateMaterials
};
