#!/usr/bin/env bash

set -euo pipefail

DOMAIN="${DOMAIN:-ai.shivaprogramming.com}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
CERT_FILE="docker-data/letsencrypt/live/${DOMAIN}/fullchain.pem"

if [ -z "$CERTBOT_EMAIL" ]; then
  echo "Set CERTBOT_EMAIL before running. Example:"
  echo "CERTBOT_EMAIL=you@example.com ./deploy.sh"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Docker Compose is not installed."
  exit 1
fi

mkdir -p docker-data/letsencrypt docker-data/certbot-www

if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl stop nginx 2>/dev/null || true
  sudo systemctl disable nginx 2>/dev/null || true
fi

if [ ! -f "$CERT_FILE" ]; then
  echo "Creating initial TLS certificate for ${DOMAIN}..."
  docker run --rm -p 80:80 \
    -v "$(pwd)/docker-data/letsencrypt:/etc/letsencrypt" \
    certbot/certbot:latest certonly --standalone \
    --non-interactive --agree-tos --no-eff-email \
    -m "$CERTBOT_EMAIL" -d "$DOMAIN"
fi

echo "Starting Docker stack..."
$COMPOSE_CMD pull
$COMPOSE_CMD up -d --remove-orphans --build

echo "Health check..."
curl -fkfsS "https://${DOMAIN}/api/health" >/dev/null

echo "Done: https://${DOMAIN}"
