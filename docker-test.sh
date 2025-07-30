#!/bin/bash

echo "🐳 Testing Docker setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Build backend
echo "📦 Building backend image..."
cd backend-fastapi
docker build -t healthcare-forms-backend . || {
    echo "❌ Backend build failed"
    exit 1
}
echo "✅ Backend image built successfully"

# Build frontend
echo "📦 Building frontend image..."
cd ../frontend
docker build -t healthcare-forms-frontend . || {
    echo "❌ Frontend build failed"
    exit 1
}
echo "✅ Frontend image built successfully"

echo "🎉 All images built successfully!"
echo ""
echo "To run the containers:"
echo "  docker-compose up"