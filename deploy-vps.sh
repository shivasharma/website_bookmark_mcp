#!/usr/bin/env bash

set -euo pipefail

APP_DOMAIN="ai.shivaprogramming.com"
CERT_DIR="/etc/letsencrypt/live/${APP_DOMAIN}"

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Docker Compose is not installed."
  exit 1
fi

echo "Checking required files..."
for file in docker-compose.yml nginx.conf .env; do
  if [ ! -f "$file" ]; then
    echo "Missing required file: $file"
    exit 1
  fi
done

echo "Checking TLS certificates..."
if [ ! -f "${CERT_DIR}/fullchain.pem" ] || [ ! -f "${CERT_DIR}/privkey.pem" ]; then
  echo "TLS cert files not found in ${CERT_DIR}"
  echo "Run: sudo certbot certonly --standalone -d ${APP_DOMAIN}"
  exit 1
fi

mkdir -p certbot

echo "Starting stack..."
$COMPOSE_CMD pull
$COMPOSE_CMD up -d --remove-orphans --build

echo "Service status:"
$COMPOSE_CMD ps

echo "Checking app health from inside container..."
$COMPOSE_CMD exec -T app node -e "fetch('http://localhost:3001/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

echo "Checking HTTPS endpoint..."
curl -fkfsS "https://${APP_DOMAIN}/api/health" >/dev/null

echo "Deployment complete: https://${APP_DOMAIN}"
