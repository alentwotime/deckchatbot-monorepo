const { body, validationResult } = require('express-validator');
const { addMessage, getRecentMessages } = require('../memory');
const {
  rectangleArea,
  circleArea,
  triangleArea,
  shapeFromMessage,
  deckAreaExplanation
} = require('../src/utils/geometry');
const config = require('../config');
const logger = require('../src/utils/logger');
const { askChat } = require('../services/backend.service'); // Changed import to backend.service

const validate = [body('message').exists({ checkFalsy: true }).withMessage('message is required')];

async function chatbot(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { message } = req.body;
  const calculationGuide = `Here’s a detailed guide for calculating square footage and other shapes:
1. Rectangle: L × W
2. Triangle: (1/2) × Base × Height
3. Circle: π × Radius²
4. Half Circle: (1/2) × π × Radius²
5. Quarter Circle: (1/4) × π × Radius²
6. Trapezoid: (1/2) × (Base1 + Base2) × Height
7. Complex Shapes: sum of all simpler shapes’ areas.
8. Fascia Board: total perimeter length (excluding steps).`;
  try {
    await addMessage('user', message);
    const shape = shapeFromMessage(message);
    if (shape) {
      const { type, dimensions } = shape;
      let area = 0;
      let perimeter = null;
      if (type === 'rectangle') {
        area = rectangleArea(dimensions.length, dimensions.width);
        perimeter = 2 * (dimensions.length + dimensions.width);
      } else if (type === 'circle') {
        area = circleArea(dimensions.radius);
        perimeter = 2 * Math.PI * dimensions.radius;
      } else if (type === 'triangle') {
        area = triangleArea(dimensions.base, dimensions.height);
      } else if (type === 'trapezoid') {
        area = 0.5 * (dimensions.base1 + dimensions.base2) * dimensions.height;
      }
      const explanation = deckAreaExplanation({ type, dimensions });
      let reply = `The ${type} area is ${area.toFixed(2)}.`;
      if (perimeter !== null) {
        reply += ` Perimeter is ${perimeter.toFixed(2)}.`;
      }
      reply += ` ${explanation}`;
      if (type === 'rectangle') {
        reply += ' simple deck with no cutouts';
      }
      await addMessage('assistant', reply);
      return res.json({ response: reply });
    }
    const history = getRecentMessages();
    const botReply = await askChat([
      { role: 'system', content: `You are a smart math bot using this calculation guide:
${calculationGuide}
Always form follow-up questions if needed to clarify user data.` },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ]);
    await addMessage('assistant', botReply);
    res.json({ response: botReply });
  } catch (err) {
    logger.error(err.stack);
    err.userMessage = 'Error communicating with backend service for chat.'; // Updated error message
    next(err);
  }
}

module.exports = { chatbot, validate };
