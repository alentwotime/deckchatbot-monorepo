const axios = require('axios');
const config = require('../config');
const logger = require('../src/utils/logger');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'; // Default to local backend

class BackendService {
  constructor() {
    // No API key needed here as it will be handled by the backend
  }

  async askChat(messages, options = {}) {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/bot-query`,
        { messages, options }, // Send messages and options to backend
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      return response.data.response; // Assuming backend returns { response: '...' }
    } catch (error) {
      logger.error('Backend chat API error:', error.response?.data || error.message);
      throw new Error('Failed to get chat response from backend');
    }
  }

  async analyzeImage(imageBase64, prompt = 'Analyze this image') {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/analyze-image`,
        {
          imageBase64,
          prompt
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // Increased timeout for image analysis
        }
      );
      return response.data.result; // Assuming backend returns { result: '...' }
    } catch (error) {
      logger.error('Backend image analysis API error:', error.response?.data || error.message);
      throw new Error('Failed to analyze image with backend');
    }
  }
}

const backendService = new BackendService();

module.exports = {
  askChat: (messages, options) => backendService.askChat(messages, options),
  analyzeImage: (imageBase64, prompt) => backendService.analyzeImage(imageBase64, prompt)
};
