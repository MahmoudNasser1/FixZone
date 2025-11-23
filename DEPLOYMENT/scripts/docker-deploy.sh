#!/bin/bash

###############################################################################
# Fix Zone ERP - Docker Deployment Script
# سكريبت النشر باستخدام Docker
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fix Zone ERP - Docker Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed!${NC}"
    echo -e "${YELLOW}Install Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from example...${NC}"
    if [ -f "DEPLOYMENT/env.docker.example" ]; then
        cp DEPLOYMENT/env.docker.example .env
        echo -e "${YELLOW}Please edit .env file with your values!${NC}"
        echo -e "${YELLOW}Press Enter to continue after editing...${NC}"
        read
    elif [ -f ".env.docker.example" ]; then
        cp .env.docker.example .env
        echo -e "${YELLOW}Please edit .env file with your values!${NC}"
        echo -e "${YELLOW}Press Enter to continue after editing...${NC}"
        read
    else
        echo -e "${RED}env.docker.example not found!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ .env file exists${NC}"

# Ask for mode
echo -e "${YELLOW}Select deployment mode:${NC}"
echo "1) Development (without Nginx)"
echo "2) Production (with Nginx)"
read -p "Enter choice [1-2]: " MODE

# Build images
echo -e "${YELLOW}[1/4] Building Docker images...${NC}"
if [ "$MODE" == "2" ]; then
    docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
else
    docker compose build --no-cache
fi
echo -e "${GREEN}✓ Images built${NC}"

# Start containers
echo -e "${YELLOW}[2/4] Starting containers...${NC}"
if [ "$MODE" == "2" ]; then
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
else
    docker compose up -d
fi
echo -e "${GREEN}✓ Containers started${NC}"

# Wait for services
echo -e "${YELLOW}[3/4] Waiting for services to be ready...${NC}"
sleep 10

# Health check
echo -e "${YELLOW}[4/4] Health check...${NC}"
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Backend health check failed (may need more time)${NC}"
fi

# Show status
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Container status:"
docker compose ps
echo ""
echo -e "Useful commands:"
echo -e "  View logs: ${BLUE}docker compose logs -f${NC}"
echo -e "  Stop: ${BLUE}docker compose down${NC}"
echo -e "  Restart: ${BLUE}docker compose restart${NC}"
echo ""

