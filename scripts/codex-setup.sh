#!/bin/bash
# Codex Setup Script for DeckChatbot

# Install frontend dependencies
cd frontend
npm install --registry=https://registry.npmjs.org/
cd ..

# Install backend Python deps in venv
cd backend/backend-ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..

# Optional: Install ai-service deps with Poetry
if [ -f ai-service/pyproject.toml ]; then
  cd ai-service
  poetry install
  cd ..
fi

# Test npm registry access
echo "Testing npm registry access..."
if curl -Is https://registry.npmjs.org/ | head -n 1 | grep -q "200"; then
  echo "✅ Registry is reachable"
else
  echo "❌ npm registry error"
fi

# 🐳 Rebuild and restart Docker containers
echo "Rebuilding Docker containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ All services rebuilt and running."
