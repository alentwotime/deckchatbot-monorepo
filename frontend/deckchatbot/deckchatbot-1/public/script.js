// Deck Chatbot Frontend JavaScript
class DeckChatbot {
  constructor() {
    this.apiBase = window.location.origin;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Chat form submission
    document.getElementById('chatForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // File upload events
    document.getElementById('uploadForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.uploadFile();
    });
  }

  async sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    const imageInput = document.getElementById('imageInput');
    const image = imageInput?.files[0];

    if (!message && !image) {
      return;
    }

    this.addMessage('user', message);
    input.value = '';

    const formData = new FormData();
    formData.append('message', message);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch(`${this.apiBase}/chatbot`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      this.addMessage('bot', data.response);

      if (data.measurements) {
        this.addMessage('bot', `Extracted measurements: ${JSON.stringify(data.measurements)}`);
      }
    } catch (error) {
      console.error('Error:', error);
      this.addMessage('bot', 'An error occurred.');
    }
  }

  async uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${this.apiBase}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      alert('File uploaded successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('File upload failed');
    }
  }

  addMessage(sender, text) {
    const messages = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = sender;
    messageDiv.textContent = text;
    messages.appendChild(messageDiv);
  }
}

// Initialize the chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const fileInput = document.getElementById('fileInput');
  const responseContainer = document.getElementById('responseContainer');
  const historyContainer = document.getElementById('historyContainer');

  const updateHistory = (message, response) => {
    const historyItem = document.createElement('div');
    historyItem.innerHTML = `<p><strong>You:</strong> ${message}</p><p><strong>Bot:</strong> ${response}</p>`;
    historyContainer.appendChild(historyItem);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('message', messageInput.value);
    if (fileInput.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    responseContainer.innerHTML = '<p>Processing...</p>';

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      responseContainer.innerHTML = `<p>${data.response}</p>`;
      updateHistory(messageInput.value, data.response);
    } catch (error) {
      console.error('Error:', error);
      responseContainer.innerHTML = '<p>Failed to process your request.</p>';
    }
  });

  window.deckChatbot = new DeckChatbot();
});
