# DeckChatbot: AI-Powered Deck Design Assistant

Welcome to DeckChatbot, a smart, single-page application designed to streamline the deck design and quoting process for sales professionals. By leveraging AI, this tool assists in converting customer sketches into interactive 2D blueprints and 3D models, calculating materials, and providing real-time guidance.

## User Journey: The 5 Stages of Deck Design

The website guides the user through a seamless, five-stage process on a single scrolling page. A persistent chatbot, acting as an assistant to the salesperson, is available at every stage to provide contextual tips and support.

### Stage 1: Introduction & Chatbot
The user is greeted with a full-screen interactive chatbot that introduces the deck design process. As the user scrolls, the chatbox elegantly shrinks to the corner, remaining accessible throughout the journey.

### Stage 2: Upload Your Deck Plans
Users can upload customer-provided files:
*   **Drawings/Blueprints**: Sketches or professional blueprints with measurements (PDF, PNG, JPEG).
*   **Photos of the Area**: Pictures of the installation site for accurate 3D modeling (JPEG, PNG).

The system features drag-and-drop functionality and performs real-time validation on file types and sizes.

### Stage 3: Analysis & Calculation
The AI backend analyzes the uploaded sketches to automatically extract and display key metrics:
*   Gross Living Area (sq ft)
*   Net Square Footage (sq ft)
*   Linear Railing Footage (ft)
*   Stair Cutouts

An overlay on the sketch visualizes the calculated dimensions, with options for manual adjustments to ensure accuracy.

### Stage 4: Your Digital Blueprint
A clean, digital 2D blueprint is generated from the analyzed sketch. This interactive canvas allows for edits, such as adding or modifying deck elements like railings and stairs. The blueprint can be downloaded in PDF, JPEG, or SVG formats.

### Stage 5: 3D Deck Preview
A real-time 3D model of the deck is rendered using Three.js/Babylon.js. Key features include:
*   **Interactive Viewer**: Rotate, zoom, and pan the model.
*   **Photo Superimposition**: Overlay the 3D model onto the customer's site photos.
*   **Material Selection**: Change decking and railing materials and colors.
*   **Download Options**: Export the model as an OBJ/GLB file or take a PNG screenshot.

## Core Features

*   **AI-Powered Chatbot**: An intelligent assistant (powered by OpenAI GPT) that guides the salesperson through the quoting and design process.
*   **Automated Measurement Extraction**: AI-driven analysis of uploaded drawings to detect dimensions and features.
*   **Sketch-to-Blueprint Conversion**: Generates clean, editable 2D blueprints from user sketches.
*   **Real-time 3D Modeling**: Instantly visualizes the deck design in an interactive 3D environment.
*   **Secure File Handling**: Ensures all customer uploads are handled securely, with encryption in transit and at rest.
*   **Modular & Scalable**: Built with a modern microservices architecture for reliability and performance.

## Technical Stack

*   **Frontend**: React.js/Vue.js, HTML5, CSS3, JavaScript (ES6+), Three.js/Babylon.js
*   **Backend**: Node.js (Express) / Python (FastAPI, Django)
*   **AI & Machine Learning**: OCR and computer vision models for image analysis.
*   **Database**: SQLite for storing conversation history and measurements.

## Running the Project Locally

1.  **Prerequisites**: Ensure you have Node.js, Python 3.11, and Docker installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    pip install -r config/requirements.txt
    ```
3.  **Run with Docker Compose**:
    ```bash
    docker-compose -f docker/docker-compose.yml up --build
    ```
