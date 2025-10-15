#!/bin/bash

# Script to start Docker containers

echo "🚀 Starting Strava Leaderboard with Docker..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.docker template..."
    cp .env.docker .env
    echo ""
    echo "⚠️  Please edit .env file with your Strava API credentials before running again!"
    echo "   - STRAVA_CLIENT_ID"
    echo "   - STRAVA_CLIENT_SECRET"
    echo ""
    exit 1
fi

# Check if required env vars are set
if grep -q "your_client_id_here" .env || grep -q "your_client_secret_here" .env; then
    echo "⚠️  Please configure your Strava API credentials in .env file!"
    echo "   Get them from: https://www.strava.com/settings/api"
    exit 1
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "✅ Containers started successfully!"
echo ""
echo "📊 Application: http://localhost:3000"
echo "🗄️  MongoDB: mongodb://localhost:27017"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "🛑 Stop containers: docker-compose down"
echo ""
