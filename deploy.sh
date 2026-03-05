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

echo "Validating environment..."
for cmd in docker certbot; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
done

if [ ! -f ".env" ]; then
  echo ".env not found. Create it from .env.example first."
  exit 1
fi

for file in docker-compose.yml nginx.conf; do
  if [ ! -f "$file" ]; then
    echo "Missing required file: $file"
    exit 1
  fi
done

if [ ! -f "${CERT_DIR}/fullchain.pem" ] || [ ! -f "${CERT_DIR}/privkey.pem" ]; then
  echo "TLS cert files not found in ${CERT_DIR}"
  echo "Run: sudo certbot certonly --standalone -d ${APP_DOMAIN}"
  exit 1
fi

mkdir -p certbot

echo "Deploying stack..."
$COMPOSE_CMD pull
$COMPOSE_CMD up -d --remove-orphans --build

echo "Checking app health..."
$COMPOSE_CMD exec -T app node -e "fetch('http://localhost:3001/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

echo "Checking HTTPS..."
curl -fkfsS "https://${APP_DOMAIN}/api/health" >/dev/null

echo "Deployment complete: https://${APP_DOMAIN}"
