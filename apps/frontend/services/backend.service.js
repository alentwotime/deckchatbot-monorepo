import axios from 'axios';
import config from '../config.js';
import logger from '../src/utils/logger.js';

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

  async enhanceImage(imageBase64) {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/enhance-image`,
        { imageBase64 },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );
      return response.data.enhanced_image_base64;
    } catch (error) {
      logger.error('Backend image enhancement API error:', error.response?.data || error.message);
      throw new Error('Failed to enhance image');
    }
  }

  async uploadFile(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await axios.post(`${BACKEND_URL}/upload-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      logger.error(`Backend file upload API error: ${error.response?.data || error.message}`);
      throw new Error('Failed to upload file to backend');
    }
  }

  async analyzeFiles(files) {
    try {
      const response = await axios.post(`${BACKEND_URL}/analyze-files`, { files });
      return response.data;
    } catch (error) {
      logger.error(`Backend file analysis API error: ${error.response?.data || error.message}`);
      throw new Error('Failed to analyze files');
    }
  }

  async generateBlueprint(analysisData) {
    try {
      const response = await axios.post(`${BACKEND_URL}/generate-blueprint`, { analysisData });
      return response.data;
    } catch (error) {
      logger.error(`Backend blueprint generation API error: ${error.response?.data || error.message}`);
      throw new Error('Failed to generate blueprint');
    }
  }
}

const backendService = new BackendService();

export const askChat = (messages, options) => backendService.askChat(messages, options);
export const analyzeImage = (imageBase64, prompt) => backendService.analyzeImage(imageBase64, prompt);
export const enhanceImage = (imageBase64) => backendService.enhanceImage(imageBase64);
export const uploadFile = (file, type) => backendService.uploadFile(file, type);
export const analyzeFiles = (files) => backendService.analyzeFiles(files);
export const generateBlueprint = (analysisData) => backendService.generateBlueprint(analysisData);
