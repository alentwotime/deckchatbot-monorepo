const fetch = require('node-fetch');

async function processMessage({ text, image }) {
  try {
    const body = { model: "llava-llama3:8b", prompt: text };
    if (image) {
      body.image = image; // base64 or file path as required by Ollama API
    }

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error processing message:', error);
    throw new Error('Failed to process message');
  }
}

module.exports = { processMessage };