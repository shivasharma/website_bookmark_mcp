#!/bin/bash

# Bookmark MCP Deployment Script
# This script helps deploy with proper security configuration

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Bookmark MCP Deployment Script${NC}"
echo "=================================="

# Check if running on VPS (not Windows)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    echo -e "${RED}❌ This script must be run on Linux/VPS${NC}"
    echo "Run this on your VPS, not on Windows."
    exit 1
fi

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}"

if ! command -v certbot &> /dev/null; then
    echo -e "${RED}❌ Certbot is not installed${NC}"
    echo "Install with: sudo apt-get install certbot"
    exit 1
fi
echo -e "${GREEN}✓ Certbot found${NC}"

# Check certificate existence
echo -e "\n${YELLOW}Checking SSL certificates...${NC}"

CERT_DIR="/etc/letsencrypt/live/ai.shivaprogramming.com"
if [ ! -d "$CERT_DIR" ]; then
    echo -e "${RED}❌ Certificate directory not found: $CERT_DIR${NC}"
    echo "Create certificates with: sudo certbot certonly --standalone -d ai.shivaprogramming.com"
    exit 1
fi

if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
    echo -e "${RED}❌ Certificate files missing${NC}"
    exit 1
fi
echo -e "${GREEN}✓ SSL certificates found${NC}"

# Check .env file
echo -e "\n${YELLOW}Checking environment configuration...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from template...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠ Please edit .env with your actual values:${NC}"
        echo "  - SESSION_SECRET (run: openssl rand -base64 32)"
        echo "  - DB_PASSWORD"
        echo "  - OAuth credentials"
        exit 1
    fi
fi

# Verify critical .env values
for var in SESSION_SECRET DB_PASSWORD GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET CLIENT_ID_GITHUB CLIENT_SECRET_GITHUB; do
    if ! grep -q "^${var}=" .env || grep "^${var}=\$\|^${var}=$\|^${var}=your_\|^${var}=-\)" .env > /dev/null; then
        echo -e "${RED}❌ $var not properly configured in .env${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ Environment variables configured${NC}"

# Create required directories
echo -e "\n${YELLOW}Setting up directories...${NC}"
mkdir -p certbot
chmod 755 certbot
echo -e "${GREEN}✓ Directories ready${NC}"

# Check if containers are already running
echo -e "\n${YELLOW}Checking for running containers...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠ Containers already running. Stopping before restart...${NC}"
    docker-compose down
fi

# Build and start
echo -e "\n${YELLOW}Building and starting containers...${NC}"
docker-compose pull
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
echo -e "\n${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Verify services
echo -e "\n${YELLOW}Verifying services...${NC}"

if ! docker-compose exec -T app curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ App health check failed${NC}"
    docker-compose logs app
    exit 1
fi
echo -e "${GREEN}✓ App service healthy${NC}"

# Test HTTPS
echo -e "\n${YELLOW}Testing HTTPS...${NC}"
if curl -s -I https://ai.shivaprogramming.com > /dev/null; then
    echo -e "${GREEN}✓ HTTPS endpoint accessible${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS endpoint not immediately accessible (may take a moment for DNS)${NC}"
fi

# Display status
echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "Services Status:"
docker-compose ps
echo ""
echo "Access your application at:"
echo -e "  ${GREEN}https://ai.shivaprogramming.com${NC}"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f [service]"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo ""
echo "Next steps:"
echo "  1. Verify https://ai.shivaprogramming.com loads"
echo "  2. Check logs: docker-compose logs -f"
echo "  3. Set up certificate renewal cron job"
echo ""
