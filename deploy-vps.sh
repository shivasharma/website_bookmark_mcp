#!/bin/bash

# Quick Deployment Instructions for VPS

echo "🔧 Deploying Bookmark MCP with nginx + SSL/TLS"
echo "================================================"

# 1. Stop existing container
echo "Stopping existing container..."
docker stop bookmark-app 2>/dev/null || true
docker rm bookmark-app 2>/dev/null || true

# 2. Verify we have the files
echo "Checking configuration files..."
if [ ! -f "nginx.conf" ]; then
    echo "ERROR: nginx.conf not found!"
    echo "Make sure all files are copied to VPS:"
    echo "  - docker-compose.yml"
    echo "  - nginx.conf"
    echo "  - .env (with your secrets)"
    exit 1
fi

# 3. Verify certificates
echo "Checking SSL certificates..."
if [ ! -f "/etc/letsencrypt/live/ai.shivaprogramming.com/fullchain.pem" ]; then
    echo "ERROR: SSL certificate not found!"
    echo "Run: sudo certbot certonly --standalone -d ai.shivaprogramming.com"
    exit 1
fi
echo "✓ Certificates found"

# 4. Check certificate permissions
sudo chmod 644 /etc/letsencrypt/live/ai.shivaprogramming.com/fullchain.pem
sudo chmod 644 /etc/letsencrypt/live/ai.shivaprogramming.com/privkey.pem

# 5. Create certbot directory
mkdir -p certbot
chmod 755 certbot

# 6. Stop any existing docker-compose services
echo "Cleaning up existing Docker composition..."
docker-compose down 2>/dev/null || true

# 7. Pull images
echo "Pulling latest images..."
docker-compose pull

# 8. Build
echo "Building containers..."
docker-compose build --no-cache

# 9. Start services
echo "Starting services..."
docker-compose up -d

# 10. Wait for services to start
echo "Waiting for services to initialize..."
sleep 15

# 11. Verify services
echo ""
echo "📋 Service Status:"
docker-compose ps

# 12. Test app health
echo ""
echo "Testing app health..."
if docker-compose exec -T app curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✓ App is healthy"
else
    echo "⚠ App health check failed - checking logs..."
    docker-compose logs app | tail -20
fi

# 13. Test HTTPS
echo ""
echo "Testing HTTPS..."
if curl -s -I https://ai.shivaprogramming.com 2>/dev/null | grep -q "200\|301"; then
    echo "✓ HTTPS endpoint accessible"
else
    echo "⚠ HTTPS not immediately accessible (may take a moment for DNS)"
fi

# 14. Display final status
echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "Access your application at:"
echo "  🔗 https://ai.shivaprogramming.com"
echo ""
echo "Check logs:"
echo "  docker-compose logs -f app"
echo "  docker-compose logs -f nginx"
echo ""
