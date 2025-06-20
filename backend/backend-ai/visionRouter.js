// apps/backend/visionRouter.js

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const LLAVA_MODEL_NAME = process.env.LLAVA_MODEL_NAME || 'llava-llama3';

// POST /vision/analyze - Upload image and get vision result from LLaVA
router.post('/analyze', upload.single('image'), async (req, res) => {
  const imagePath = path.join(__dirname, '..', req.file.path);

  try {
    const form = new FormData();
    form.append('model', LLAVA_MODEL_NAME);
    form.append('image', fs.createReadStream(imagePath));
    form.append('prompt', req.body.prompt || 'What is shown in this deck sketch? Identify measurements, stairs, and door.');

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, form, {
      headers: form.getHeaders()
    });

    res.json({ success: true, result: response.data });
  } catch (err) {
    console.error('LLaVA error:', err.message);
    res.status(500).json({ success: false, error: 'Vision model failed' });
  } finally {
    fs.unlinkSync(imagePath); // Clean up temp file
  }
});

module.exports = router;
