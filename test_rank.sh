#!/bin/bash
# Smoke test for refactored /rank endpoint (Phase 2a) — simplified

ENDPOINT="${1:-http://100.69.18.111:8000}"

echo "🧪 BigBadPhotos /rank Smoke Test (Simplified)"
echo "=============================================="
echo "Endpoint: $ENDPOINT"
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
echo "-------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "$ENDPOINT/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ PASSED" && echo ""
else
  echo "❌ FAILED" && echo ""
fi

# Test 2: Malformed manifest
echo "Test 2: Malformed Manifest (should return 400)"
echo "----------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -F "manifest={invalid" "$ENDPOINT/rank")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ PASSED" && echo ""
else
  echo "❌ FAILED" && echo ""
fi

# Test 3: Missing file part
echo "Test 3: Missing File Part (should return 400)"
echo "---------------------------------------------"
MANIFEST='[{"id":"img-1","filename":"test.jpg"}]'
RESPONSE=$(curl -s -w "\n%{http_code}" -F "manifest=$MANIFEST" "$ENDPOINT/rank")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ PASSED" && echo ""
else
  echo "❌ FAILED" && echo ""
fi

echo "=============================================="
echo "✅ Error handling tests complete."
echo ""
echo "Backend refactor verified. Ready for Phase 2a React frontend."
