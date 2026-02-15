#!/bin/bash

# CourtCaller Docker Startup Script

set -e

echo "🚀 CourtCaller Docker Startup"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your ELEVENLABS_API_KEY"
    echo "   Then run this script again"
    exit 1
fi

# Check if API key is set
if grep -q "your_api_key_here" .env; then
    echo "⚠️  Please edit .env and add your ELEVENLABS_API_KEY"
    echo "   Get your API key from: https://elevenlabs.io/app/api-keys"
    exit 1
fi

echo "✅ Docker is ready"
echo "✅ .env file configured"
echo ""

# Ask if user wants to rebuild
read -p "Do you want to rebuild the image? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Building Docker image..."
    docker-compose build --no-cache
fi

echo ""
echo "🚀 Starting CourtCaller..."
docker-compose up -d

echo ""
echo "✅ CourtCaller is running!"
echo ""
echo "📱 Open in your browser: http://localhost:5000"
echo ""
echo "📋 View logs:    docker-compose logs -f"
echo "🛑 Stop server:  docker-compose down"
echo "🔄 Restart:      docker-compose restart"
echo ""
