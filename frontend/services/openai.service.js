const axios = require('axios');
const config = require('../config');
const logger = require('../src/utils/logger');

class OpenAIService {
  constructor() {
    this.apiKey = config.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      logger.warn('OpenAI API key not configured - using mock responses');
    }
  }

  async askChat(messages, options = {}) {
    if (!this.apiKey) {
      return 'mocked';
    }
    try {
      const {
        model = config.OPENAI_MODEL,
        maxTokens = config.OPENAI_MAX_TOKENS,
        temperature = config.OPENAI_TEMPERATURE
      } = options;

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          max_tokens: maxTokens,
          temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  async analyzeImage(imageBase64, prompt = 'Analyze this image') {
    if (!this.apiKey) {
      return 'mock-image';
    }
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                }
              ]
            }
          ],
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI vision API error:', error.response?.data || error.message);
      throw new Error('Failed to analyze image with OpenAI');
    }
  }
}

const openaiService = new OpenAIService();

module.exports = {
  askChat: (messages, options) => openaiService.askChat(messages, options),
  analyzeImage: (imageBase64, prompt) => openaiService.analyzeImage(imageBase64, prompt)
};

