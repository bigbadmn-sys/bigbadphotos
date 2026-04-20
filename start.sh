#!/bin/bash
set -e

cd "$(dirname "$0")"

# Load .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

# Activate Python venv if present
if [ -f venv/bin/activate ]; then
  source venv/bin/activate
fi

echo "Starting BigBadPhotos..."

if [ -n "$BBP_CERT" ] && [ -n "$BBP_KEY" ]; then
  echo "Mode:     HTTPS (Tailscale)"
  echo "URL:      https://${BBP_HOSTNAME}:8443"
else
  echo "Mode:     HTTP (local dev)"
  echo "URL:      http://localhost:8001"
fi

if [ -n "$BBP_PASSWORD" ]; then
  echo "Password: set"
else
  echo "Password: none (open access)"
fi

echo ""
BBP_PORT=8002 python3 app.py
