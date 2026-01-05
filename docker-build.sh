#!/bin/bash

# OCN System Docker Build & Push Script
# Usage: ./docker-build.sh [version]

set -e

VERSION=${1:-latest}
IMAGE_NAME="mbx92/ocn-system"

echo "🐳 Building Docker image..."
echo "   Image: $IMAGE_NAME:$VERSION"
echo ""

# Build the image
docker build \
  -t $IMAGE_NAME:$VERSION \
  -t $IMAGE_NAME:latest \
  .

echo ""
echo "✅ Build successful!"
echo ""
echo "📤 Pushing to Docker Hub..."

# Push both tags
docker push $IMAGE_NAME:$VERSION

if [ "$VERSION" != "latest" ]; then
  docker push $IMAGE_NAME:latest
fi

echo ""
echo "✅ Push successful!"
echo ""
echo "🎉 Docker image updated:"
echo "   - $IMAGE_NAME:$VERSION"
echo "   - $IMAGE_NAME:latest"
echo ""
echo "📝 To deploy on production:"
echo "   docker pull $IMAGE_NAME:latest"
echo "   docker-compose up -d"
