const potrace = require('potrace');
const { validationResult } = require('express-validator');
const logger = require('../src/utils/logger');

const POTRACE_THRESHOLD = 180;

async function digitalizeDrawing(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const svg = await new Promise((resolve, reject) => {
      potrace.trace(req.file.buffer, { threshold: POTRACE_THRESHOLD, turdSize: 2 }, (err, svgOutput) => {
        if (err) {
          logger.error('Potrace tracing error:', err);
          return reject(new Error('Error occurred during SVG tracing'));
        }
        resolve(svgOutput);
      });
    });

    // Successfully traced, send the SVG response
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);

  } catch (err) {
    // Log full stack trace in development, only message in production to avoid large logs
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error in digitalizeDrawing:', err.stack || err);
    } else {
      logger.error('Error in digitalizeDrawing:', err.message || err);
    }
    res.status(500).json({ errors: [{ msg: 'Error digitalizing drawing.' }] });
  }
}

module.exports = { digitalizeDrawing };
