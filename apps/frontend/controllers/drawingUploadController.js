const logger = require('../src/utils/logger');
const { analyzeImage } = require('../services/backend.service');

async function uploadDrawing(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const prompt = "Analyze this drawing for deck measurements and components.";

    const analysisResult = await analyzeImage(imageBase64, prompt);

    res.json({ status: 'success', analysisResult });
  } catch (err) {
    logger.error(`Error processing drawing upload: ${err.stack}`);
    res.status(500).json({ error: 'Error processing drawing.' });
  }
}

module.exports = { uploadDrawing };
