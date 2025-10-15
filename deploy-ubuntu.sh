#!/bin/bash

# Strava Leaderboard - Ubuntu Deployment Script
# This script automates the deployment process on Ubuntu server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Strava Leaderboard - Ubuntu Deployment${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}Error: This script is designed for Linux/Ubuntu only.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker installed successfully!${NC}"
    echo -e "${YELLOW}Please logout and login again to apply docker group changes.${NC}"
    exit 0
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose plugin not found.${NC}"
    echo -e "${YELLOW}Please install Docker Compose: sudo apt install docker-compose-plugin${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file not found!${NC}"
    if [ -f ".env.prod.example" ]; then
        echo -e "${YELLOW}Creating .env from .env.prod.example...${NC}"
        cp .env.prod.example .env
        echo -e "${YELLOW}Please edit .env file with your configuration:${NC}"
        echo -e "  - STRAVA_CLIENT_ID"
        echo -e "  - STRAVA_CLIENT_SECRET"
        echo -e "  - STRAVA_REDIRECT_URI"
        echo -e "  - SESSION_SECRET (generate with: openssl rand -hex 32)"
        echo -e "\nAfter editing .env, run this script again."
        exit 1
    else
        echo -e "${RED}Error: .env.prod.example not found!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ .env file found${NC}"

# Check if docker-compose.prod.yml exists
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}Error: docker-compose.prod.yml not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ docker-compose.prod.yml found${NC}"

# Check if user needs to login to GitHub Container Registry
echo -e "\n${YELLOW}Checking GitHub Container Registry access...${NC}"
read -p "Is your repository private? (y/n): " is_private

if [[ "$is_private" == "y" || "$is_private" == "Y" ]]; then
    echo -e "${YELLOW}You need to login to GitHub Container Registry.${NC}"
    echo -e "Generate a token at: https://github.com/settings/tokens/new"
    echo -e "Required scope: read:packages\n"
    
    read -p "Enter your GitHub username: " github_username
    read -sp "Enter your GitHub token: " github_token
    echo
    
    echo "$github_token" | docker login ghcr.io -u "$github_username" --password-stdin
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Successfully logged in to ghcr.io${NC}"
    else
        echo -e "${RED}✗ Failed to login to ghcr.io${NC}"
        exit 1
    fi
fi

# Pull latest images
echo -e "\n${YELLOW}Pulling latest Docker images...${NC}"
docker compose -f docker-compose.prod.yml pull

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to pull images${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Images pulled successfully${NC}"

# Start services
echo -e "\n${YELLOW}Starting services...${NC}"
docker compose -f docker-compose.prod.yml up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to start services${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Services started successfully${NC}"

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check if containers are running
if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Containers are running${NC}"
else
    echo -e "${RED}✗ Some containers failed to start${NC}"
    echo -e "${YELLOW}Showing logs:${NC}"
    docker compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Final message
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Deployment Successful! 🎉${NC}"
echo -e "${GREEN}========================================${NC}\n"
echo -e "Application is running at:"
echo -e "  ${GREEN}http://$SERVER_IP:3000${NC}"
echo -e "  ${GREEN}http://localhost:3000${NC}\n"
echo -e "Useful commands:"
echo -e "  View logs:    ${YELLOW}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "  Stop:         ${YELLOW}docker compose -f docker-compose.prod.yml down${NC}"
echo -e "  Restart:      ${YELLOW}docker compose -f docker-compose.prod.yml restart${NC}"
echo -e "  Update app:   ${YELLOW}docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d${NC}\n"
echo -e "Next steps:"
echo -e "  1. Configure Nginx reverse proxy (optional)"
echo -e "  2. Setup SSL certificate with Certbot"
echo -e "  3. Configure firewall (ufw)"
echo -e "  4. Setup automatic backups\n"
echo -e "See UBUNTU-DEPLOY.md for detailed instructions.\n"
