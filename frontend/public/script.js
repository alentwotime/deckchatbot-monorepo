// Deck Chatbot Frontend JavaScript
class DeckChatbot {
  constructor() {
    this.apiKey = 'revamp123secure';
    this.baseUrl = window.location.origin;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadTheme();
    this.showWelcomeMessage();
  }

  bindEvents() {
    document.getElementById('chatForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });
    this.setupFileUpload();
  }

  setupFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const loader = document.getElementById('uploadLoader');

    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) {
        this.selectedFile = file;
        this.showFilePreview(file);
      }
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.showFilePreview(file);
      }
    });

    uploadButton?.addEventListener('click', () => {
      if (this.selectedFile) {
        loader?.classList.remove('d-none');
        this.uploadFile('/upload-image').finally(() => loader?.classList.add('d-none'));
      } else {
        alert('Please select a file first.');
      }
    });
  }

  showFilePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImage = document.getElementById('preview');
      if (previewImage) {
        previewImage.src = e.target.result;
        previewImage.classList.remove('d-none');
      }
    };
    reader.readAsDataURL(file);
  }

  async uploadFile(endpoint) {
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        alert('File uploaded successfully.');
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch (error) {
      alert(error.message || 'Upload failed.');
    }
  }

  async sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput?.value.trim();
    if (!message) return;

    this.appendMessage('user', message);
    this.appendMessage('bot', 'Bot is typing...');

    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      document.querySelector('.chat-message.bot:last-child')?.remove();
      this.appendMessage('bot', this.renderMarkdown(data.reply || 'No response'));
    } catch (err) {
      document.querySelector('.chat-message.bot:last-child')?.remove();
      this.appendMessage('bot', 'Failed to send message');
    }

    messageInput.value = '';
  }

  appendMessage(sender, html) {
    const chatLog = document.getElementById('chatLog');
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}`;
    messageEl.innerHTML = `
      <div>${html}</div>
      <div class="timestamp">${new Date().toLocaleTimeString()}</div>
    `;
    chatLog?.appendChild(messageEl);
    chatLog?.scrollTo({ top: chatLog.scrollHeight, behavior: 'smooth' });
  }

  renderMarkdown(text) {
    return window.marked ? marked.parse(text) : text;
  }

  showWelcomeMessage() {
    alert('Welcome to Deck Chatbot!');
  }
}

// Initialize the chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.deckChatbot = new DeckChatbot();
});