#!/bin/bash

# Script to rebuild Docker containers and test the changes

set -e  # Exit on any error

echo "Stopping existing containers..."
cd "$(dirname "$0")/../docker"
docker-compose down

echo "Rebuilding containers..."
docker-compose build --no-cache

echo "Starting containers..."
docker-compose up -d

echo "Checking container status..."
docker-compose ps

echo "Checking logs for ai-service..."
docker-compose logs ai-service

echo "Done! Check the logs above for any errors."
