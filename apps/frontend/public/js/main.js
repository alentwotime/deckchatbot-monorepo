/**
 * DeckChatBot Frontend Main JavaScript
 * Handles file uploads, 3D visualization, blueprint generation, chat integration, and smooth scrolling
 */

// ===== GLOBAL VARIABLES =====
let currentDeck = null;
let deck3DViewer = null;
let blueprintGenerator = null;
let drawingProcessor = null;
let chatSocket = null;
let isThemeDark = false;

// API endpoints
const API_BASE = window.location.origin;
const API_ENDPOINTS = {
    upload: `${API_BASE}/upload-file`,
    analyze: `${API_BASE}/analyze-files`,
    blueprint: `${API_BASE}/generate-blueprint`,
    chat: `${API_BASE}/bot-query`,
    health: `${API_BASE}/health`
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeNavigation();
    initializeScrolling();
    initializeUpload();
    initializeVisualizer();
    initializeBlueprint();
    initializeChat();
    initializeAnimations();

    console.log('DeckChatBot frontend initialized successfully');
});

// ===== THEME MANAGEMENT =====
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    // Default is now dark (cyberpunk)
    const savedTheme = localStorage.getItem('theme') || 'dark';

    setTheme(savedTheme);

    themeToggle.addEventListener('click', function() {
        const newTheme = isThemeDark ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function setTheme(theme) {
    isThemeDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    // Update theme-dependent components
    if (deck3DViewer) {
        updateVisualizerTheme();
    }

    // Update robot eyes color based on theme
    const robotEyes = document.querySelectorAll('.robot-eye');
    if (robotEyes.length > 0) {
        const eyeColor = isThemeDark ? 'var(--primary-color)' : 'var(--secondary-color)';
        const eyeGlow = isThemeDark ? '0 0 8px var(--primary-color)' : '0 0 8px var(--secondary-color)';

        robotEyes.forEach(eye => {
            eye.style.background = eyeColor;
            eye.style.boxShadow = eyeGlow;
        });
    }
}

// ===== NAVIGATION =====
function initializeNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');

            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Update active link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// ===== SMOOTH SCROLLING =====
function initializeScrolling() {
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ===== FILE UPLOAD HANDLING =====
function initializeUpload() {
    const uploadInputs = {
        drawing: document.getElementById('drawing-input'),
        photo: document.getElementById('photo-input'),
        digital: document.getElementById('digital-input')
    };

    // Set up file input handlers
    Object.keys(uploadInputs).forEach(type => {
        const input = uploadInputs[type];
        if (input) {
            input.addEventListener('change', (e) => handleFileUpload(e, type));
        }
    });

    // Set up drag and drop
    setupDragAndDrop();
}

function handleFileUpload(event, type) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    showLoadingOverlay('Processing files...');

    files.forEach(file => {
        processFile(file, type);
    });
}

async function processFile(file, type) {
    try {
        const progressElement = document.getElementById(`${type}-progress`);
        showProgress(progressElement);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await fetch(API_ENDPOINTS.upload, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        handleUploadResult(result, type);

    } catch (error) {
        console.error('File processing error:', error);
        showNotification('Error processing file: ' + error.message, 'error');
    } finally {
        hideLoadingOverlay();
    }
}

function handleUploadResult(result, type) {
    const resultsContainer = document.getElementById('upload-results');
    const resultsContent = resultsContainer.querySelector('.results-content');

    // Show results container
    resultsContainer.style.display = 'block';

    // Update deck data
    if (result.deck) {
        currentDeck = result.deck;
        updateDeckDisplay(result.deck);

        // Update visualizer and blueprint
        if (deck3DViewer) {
            updateVisualizer(result.deck);
        }
        updateBlueprintData(result.deck);
    }

    // Display processing results
    displayProcessingResults(result, resultsContent);

    showNotification(`Successfully processed ${type} file`, 'success');
}

function displayProcessingResults(result, container) {
    const resultHTML = `
        <div class="processing-result">
            <h4>Processing Complete</h4>
            <div class="result-stats">
                <div class="stat">
                    <span class="stat-label">Cards Recognized:</span>
                    <span class="stat-value">${result.cardsRecognized || 0}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Confidence:</span>
                    <span class="stat-value">${Math.round((result.confidence || 0) * 100)}%</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Processing Time:</span>
                    <span class="stat-value">${result.processingTime || 0}ms</span>
                </div>
            </div>
            ${result.suggestions ? `
                <div class="suggestions">
                    <h5>Suggestions:</h5>
                    <ul>
                        ${result.suggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;

    container.innerHTML = resultHTML;
}

function setupDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.upload-area');

    uploadAreas.forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('drag-over');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('drag-over');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files);
            const type = area.id.replace('-upload', '');

            files.forEach(file => {
                processFile(file, type);
            });
        });
    });
}

// ===== 3D VISUALIZER =====
function initializeVisualizer() {
    const container = document.getElementById('three-container');
    const loadingElement = document.getElementById('visualizer-loading');

    try {
        // Import and initialize 3D model creator
        import('../../src/visualizers/deck-3d-model.js').then(module => {
            const Deck3DModelCreator = module.default;
            deck3DViewer = new Deck3DModelCreator(container);

            // Hide loading spinner
            loadingElement.style.display = 'none';

            // Append renderer to container
            container.appendChild(deck3DViewer.getDOMElement());

            // Set up controls
            setupVisualizerControls();

            console.log('3D Visualizer initialized');
        }).catch(error => {
            console.error('Failed to load 3D visualizer:', error);
            loadingElement.innerHTML = '<p>Failed to load 3D visualizer</p>';
        });
    } catch (error) {
        console.error('3D Visualizer initialization error:', error);
        loadingElement.innerHTML = '<p>3D visualization not available</p>';
    }
}

function setupVisualizerControls() {
    const layoutMode = document.getElementById('layout-mode');
    const groupBy = document.getElementById('group-by');
    const animationSpeed = document.getElementById('animation-speed');
    const resetView = document.getElementById('reset-view');
    const export3D = document.getElementById('export-3d');

    // Layout mode change
    layoutMode.addEventListener('change', (e) => {
        if (deck3DViewer) {
            deck3DViewer.setLayoutMode({ type: e.target.value });
        }
    });

    // Group by change
    groupBy.addEventListener('change', (e) => {
        if (deck3DViewer) {
            const groupByType = e.target.value === 'type';
            const groupByColor = e.target.value === 'color';
            deck3DViewer.setLayoutMode({ groupByType, groupByColor });
        }
    });

    // Animation speed change
    animationSpeed.addEventListener('input', (e) => {
        if (deck3DViewer) {
            const duration = 1000 / parseFloat(e.target.value);
            deck3DViewer.setLayoutMode({ animationDuration: duration });
        }
    });

    // Reset view
    resetView.addEventListener('click', () => {
        if (deck3DViewer) {
            deck3DViewer.setSceneOptions({
                cameraPosition: new THREE.Vector3(0, 10, 20)
            });
        }
    });

    // Export 3D model
    export3D.addEventListener('click', async () => {
        if (deck3DViewer && currentDeck) {
            try {
                showLoadingOverlay('Exporting 3D model...');
                const blob = await deck3DViewer.export3DModel({
                    format: 'gltf',
                    includeTextures: true,
                    includeAnimations: false,
                    scale: 1
                });

                downloadBlob(blob, `${currentDeck.name}_3d_model.gltf`);
                showNotification('3D model exported successfully', 'success');
            } catch (error) {
                console.error('3D export error:', error);
                showNotification('Failed to export 3D model', 'error');
            } finally {
                hideLoadingOverlay();
            }
        }
    });
}

function updateVisualizer(deck) {
    if (!deck3DViewer) return;

    // Convert deck format for 3D visualizer
    const deck3D = {
        id: deck.id,
        name: deck.name,
        cards: deck.cards.map(card => ({
            ...card,
            color: card.color || ['C']
        })),
        commander: deck.commander
    };

    deck3DViewer.setDeck(deck3D);
    updateDeckStats(deck);
}

function updateVisualizerTheme() {
    if (!deck3DViewer) return;

    const backgroundColor = isThemeDark ? 0x0f172a : 0xffffff;
    deck3DViewer.setSceneOptions({ backgroundColor });
}

function updateDeckStats(deck) {
    const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
    const avgCMC = deck.cards.reduce((sum, card) => sum + (card.manaCost * card.quantity), 0) / totalCards;

    document.getElementById('total-cards').textContent = totalCards;
    document.getElementById('avg-cmc').textContent = avgCMC.toFixed(1);
}

// ===== BLUEPRINT GENERATOR =====
function initializeBlueprint() {
    const generateBtn = document.getElementById('generate-blueprint');
    const exportBtn = document.getElementById('export-blueprint');
    const themeSelect = document.getElementById('blueprint-theme');
    const layoutSelect = document.getElementById('blueprint-layout');

    // Set up controls
    generateBtn.addEventListener('click', generateBlueprint);
    exportBtn.addEventListener('click', exportBlueprint);

    // Theme and layout changes
    themeSelect.addEventListener('change', updateBlueprintOptions);
    layoutSelect.addEventListener('change', updateBlueprintOptions);

    // Checkbox changes
    document.querySelectorAll('#blueprint input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateBlueprintOptions);
    });
}

async function generateBlueprint() {
    if (!currentDeck) {
        showNotification('Please upload a deck first', 'warning');
        return;
    }

    try {
        showLoadingOverlay('Generating blueprint...');

        // Import blueprint generator
        const module = await import('../../src/visualizers/deck-blueprint.js');
        const DeckBlueprintGenerator = module.default;

        if (!blueprintGenerator) {
            blueprintGenerator = new DeckBlueprintGenerator();
        }

        // Set deck and options
        blueprintGenerator.setDeck(currentDeck);
        blueprintGenerator.setLayoutOptions(getBlueprintOptions());

        // Generate layout
        const layout = await blueprintGenerator.generateLayout();

        // Display in blueprint area
        const display = document.getElementById('blueprint-display');
        display.innerHTML = '';
        display.appendChild(layout);

        showNotification('Blueprint generated successfully', 'success');

    } catch (error) {
        console.error('Blueprint generation error:', error);
        showNotification('Failed to generate blueprint', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

async function exportBlueprint() {
    if (!blueprintGenerator || !currentDeck) {
        showNotification('Please generate a blueprint first', 'warning');
        return;
    }

    try {
        showLoadingOverlay('Exporting blueprint...');

        const blob = await blueprintGenerator.exportBlueprint({
            format: 'pdf',
            quality: 2,
            includeMetadata: true,
            filename: `${currentDeck.name}_blueprint.pdf`
        });

        downloadBlob(blob, `${currentDeck.name}_blueprint.pdf`);
        showNotification('Blueprint exported successfully', 'success');

    } catch (error) {
        console.error('Blueprint export error:', error);
        showNotification('Failed to export blueprint', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

function getBlueprintOptions() {
    return {
        theme: document.getElementById('blueprint-theme').value,
        showManaCurve: document.getElementById('include-mana-curve').checked,
        showTypeDistribution: document.getElementById('include-type-dist').checked,
        showColorDistribution: document.getElementById('include-color-dist').checked,
        groupByType: true,
        width: 1200,
        height: 800
    };
}

function updateBlueprintOptions() {
    if (blueprintGenerator && currentDeck) {
        blueprintGenerator.setLayoutOptions(getBlueprintOptions());
    }
}

function updateBlueprintData(deck) {
    // Update blueprint with new deck data
    if (blueprintGenerator) {
        blueprintGenerator.setDeck(deck);
    }
}

// ===== CHAT INTEGRATION =====
function initializeChat() {
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');
    const chatMessages = document.getElementById('chat-messages');

    // Set up event listeners
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Initialize WebSocket connection
    initializeChatSocket();

    // Set up quick actions
    setupQuickActions();
}

function initializeChatSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

    try {
        chatSocket = new WebSocket(wsUrl);

        chatSocket.onopen = () => {
            console.log('Chat WebSocket connected');
        };

        chatSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            displayChatMessage(message, 'bot');
        };

        chatSocket.onclose = () => {
            console.log('Chat WebSocket disconnected');
            // Attempt to reconnect after 3 seconds
            setTimeout(initializeChatSocket, 3000);
        };

        chatSocket.onerror = (error) => {
            console.error('Chat WebSocket error:', error);
        };
    } catch (error) {
        console.error('Failed to initialize chat socket:', error);
        // Fallback to HTTP-based chat
        setupHttpChat();
    }
}

function setupHttpChat() {
    // Fallback HTTP-based chat implementation
    console.log('Using HTTP-based chat fallback');
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Display user message
    displayChatMessage({ content: message }, 'user');
    input.value = '';

    try {
        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
            // Send via WebSocket
            chatSocket.send(JSON.stringify({
                message: message,
                deck: currentDeck,
                timestamp: new Date().toISOString()
            }));
        } else {
            // Send via HTTP
            const response = await fetch(API_ENDPOINTS.chat, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{ content: message, role: 'user' }],
                    options: { deck: currentDeck }
                })
            });

            if (response.ok) {
                const result = await response.json();
                displayChatMessage({ content: result.response }, 'bot');
            } else {
                throw new Error('Chat request failed');
            }
        }
    } catch (error) {
        console.error('Chat error:', error);
        displayChatMessage({
            content: 'Sorry, I encountered an error. Please try again.'
        }, 'bot');
    }
}

function displayChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `<p>${message.content}</p>`;

    messageElement.appendChild(avatar);
    messageElement.appendChild(content);

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendSuggestion(suggestion) {
    const input = document.getElementById('chat-input');
    input.value = suggestion;
    sendMessage();
}

function setupQuickActions() {
    // Quick action buttons
    window.analyzeDeck = () => {
        if (currentDeck) {
            sendSuggestion(`Analyze my ${currentDeck.name} deck`);
        } else {
            showNotification('Please upload a deck first', 'warning');
        }
    };

    window.suggestCards = () => {
        if (currentDeck) {
            sendSuggestion(`Suggest cards for my ${currentDeck.name} deck`);
        } else {
            showNotification('Please upload a deck first', 'warning');
        }
    };

    window.checkLegality = () => {
        if (currentDeck) {
            sendSuggestion(`Check the legality of my ${currentDeck.name} deck`);
        } else {
            showNotification('Please upload a deck first', 'warning');
        }
    };
}

// ===== ANIMATIONS =====
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.upload-card, .feature-card, .section-header').forEach(el => {
        observer.observe(el);
    });

    // Initialize robot eye tracking
    initializeRobotEyeTracking();
}

// Robot Eye Tracking
function initializeRobotEyeTracking() {
    document.addEventListener('mousemove', function(e) {
        const eyes = document.querySelectorAll('.robot-eye');
        eyes.forEach(eye => {
            const rect = eye.getBoundingClientRect();
            const eyeCenterX = rect.left + rect.width / 2;
            const eyeCenterY = rect.top + rect.height / 2;

            const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
            const distance = Math.min(3, Math.sqrt(Math.pow(e.clientX - eyeCenterX, 2) + Math.pow(e.clientY - eyeCenterY, 2)) / 10);

            const pupilX = Math.cos(angle) * distance;
            const pupilY = Math.sin(angle) * distance;

            eye.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
        });
    });
}

// ===== UTILITY FUNCTIONS =====
function showLoadingOverlay(text = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    loadingText.textContent = text;
    overlay.classList.add('active');
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
}

function showProgress(progressElement) {
    if (progressElement) {
        progressElement.style.display = 'block';
        progressElement.style.width = '0%';

        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressElement.style.width = `${progress}%`;
        }, 200);
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateDeckDisplay(deck) {
    // Update deck summary in chat sidebar
    const deckSummary = document.getElementById('deck-summary');
    if (deckSummary && deck) {
        const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
        const avgCMC = deck.cards.reduce((sum, card) => sum + (card.manaCost * card.quantity), 0) / totalCards;

        deckSummary.innerHTML = `
            <div class="deck-info">
                <h5>${deck.name}</h5>
                <div class="deck-stats">
                    <div class="stat">
                        <span class="stat-label">Format:</span>
                        <span class="stat-value">${deck.format || 'Unknown'}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total Cards:</span>
                        <span class="stat-value">${totalCards}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Avg. CMC:</span>
                        <span class="stat-value">${avgCMC.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('An unexpected error occurred', 'error');
});

// ===== EXPORT GLOBAL FUNCTIONS =====
window.scrollToSection = scrollToSection;
window.sendSuggestion = sendSuggestion;
window.analyzeDeck = analyzeDeck;
window.suggestCards = suggestCards;
window.checkLegality = checkLegality;

console.log('DeckChatBot main.js loaded successfully');
