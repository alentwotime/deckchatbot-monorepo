#!/bin/bash
# scripts/build-and-push.sh

REPO="alentwotime/unifiedservices"
VERSION=${1:-latest}

echo "🐳 Building containers for hybrid deployment..."

# Build all services
docker build -t $REPO:frontend -f apps/frontend/Dockerfile .
docker build -t $REPO:backend -f apps/backend/Dockerfile .
docker build -t $REPO:ai-service -f apps/ai-service/Dockerfile .

# Tag with version
docker tag $REPO:frontend $REPO:frontend-$VERSION
docker tag $REPO:backend $REPO:backend-$VERSION
docker tag $REPO:ai-service $REPO:ai-service-$VERSION

# Login and push
echo $DOCKERHUB_ACCESS_TOKEN | docker login --username alentwotime --password-stdin

docker push $REPO:frontend
docker push $REPO:backend
docker push $REPO:ai-service
docker push $REPO:frontend-$VERSION
docker push $REPO:backend-$VERSION
docker push $REPO:ai-service-$VERSION

echo "✅ All images pushed to Docker Hub!"
