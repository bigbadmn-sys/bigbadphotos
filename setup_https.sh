#!/bin/bash
set -e

echo "=== BigBadPhotos Setup ==="
echo ""

# Verify Tailscale is running
if ! tailscale status &>/dev/null; then
  echo "ERROR: Tailscale is not running. Start it and try again."
  exit 1
fi

# Get Tailscale hostname and IP
HOSTNAME=$(tailscale status --json | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d['Self']['DNSName'].rstrip('.'))
")
TS_IP=$(tailscale status --json | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d['Self']['TailscaleIPs'][0])
")

echo "Tailscale hostname : $HOSTNAME"
echo "Tailscale IP       : $TS_IP"
echo ""

# Write .env (HTTP mode — no cert needed for iOS)
cat > "$(dirname "$0")/.env" << EOF
BBP_HOSTNAME=$HOSTNAME
BBP_TS_IP=$TS_IP
# Leave BBP_CERT / BBP_KEY blank for HTTP mode (fine for iOS on Tailscale)
BBP_CERT=
BBP_KEY=
# Set your access password:
BBP_PASSWORD=
EOF

echo "Written .env"
echo ""
echo "=== Next steps ==="
echo ""
echo "  1. Set your password in two places:"
echo "     .env              →  BBP_PASSWORD=yourpassword"
echo "     frontend/.env.local  →  VITE_APP_PASSWORD=yourpassword"
echo ""
echo "  2. Build the frontend:"
echo "     cd frontend && npm run build"
echo ""
echo "  3. Start the server:"
echo "     ./start.sh"
echo ""
echo "  4. Access the app:"
echo "     Mac (desktop)  →  http://localhost:8001"
echo "     iPhone/iPad    →  http://$TS_IP:8001"
echo ""
echo "  5. On iPhone/iPad: install Tailscale from the App Store,"
echo "     sign in with the same account, then open the URL above."
echo ""
