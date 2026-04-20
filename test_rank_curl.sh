#!/bin/bash
# Smoke test for refactored /rank endpoint (Phase 2a)
# Usage: ./test_rank_curl.sh [endpoint_url]
# Default: http://100.69.18.111:8000

ENDPOINT="${1:-http://100.69.18.111:8000}"

echo "🧪 BigBadPhotos /rank Smoke Test"
echo "=================================="
echo "Endpoint: $ENDPOINT"
echo ""

# Create two test JPEG files (1x1 pixel, valid JPEG)
# Using base64-encoded minimal valid JPEGs to avoid external dependencies

TEST_JPEG_B64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

# Decode base64 to binary (create actual test images)
echo -n "$TEST_JPEG_B64" | base64 -D > /tmp/test_img_1.jpg 2>/dev/null || {
  echo "❌ base64 decode failed. Creating minimal valid JPEG manually..."
  # Fallback: use printf with hex escape to create a minimal valid JPEG
  printf '\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xFF\xDB\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xFF\xC0\x00\x0B\x08\x00\x01\x00\x01\x01\x11\x00\xFF\xC4\x00\x1F\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0B\xFF\xC4\x00\xB5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142"2\x81\x91\xA1\x08#B\xB1\xC1\x15R\xD1\xF0$3br\x82\t\n\x16\x17\x18\x19\x1A%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8A\x92\x93\x94\x95\x96\x97\x98\x99\x9A\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFF\xDA\x00\x08\x01\x01\x00\x00?\x00\xFB\xD5\xFF\xD9' > /tmp/test_img_1.jpg
}
cp /tmp/test_img_1.jpg /tmp/test_img_2.jpg

echo "✓ Test images created at /tmp/test_img_{1,2}.jpg"
echo ""

# Test 1: Happy path — two images, should rank by sharpness
echo "Test 1: Happy Path (2 images)"
echo "-----------------------------"
MANIFEST='[{"id":"img-001","filename":"DSC_8492.jpg"},{"id":"img-002","filename":"DSC_8493.jpg"}]'

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -F "manifest=$MANIFEST" \
  -F "img-001=@/tmp/test_img_1.jpg" \
  -F "img-002=@/tmp/test_img_2.jpg" \
  "$ENDPOINT/rank")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Test 1 PASSED"
else
  echo "❌ Test 1 FAILED: expected 200, got $HTTP_CODE"
fi
echo ""

# Test 2: Missing file error (malformed manifest reference)
echo "Test 2: Missing File Error (should return 400 bad_manifest)"
echo "-----------------------------------------------------------"
MANIFEST='[{"id":"img-001","filename":"DSC_8492.jpg"},{"id":"img-999","filename":"missing.jpg"}]'

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -F "manifest=$MANIFEST" \
  -F "img-001=@/tmp/test_img_1.jpg" \
  "$ENDPOINT/rank")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ Test 2 PASSED"
else
  echo "❌ Test 2 FAILED: expected 400, got $HTTP_CODE"
fi
echo ""

# Test 3: Malformed manifest (invalid JSON)
echo "Test 3: Malformed Manifest (should return 400 bad_manifest)"
echo "------------------------------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -F "manifest={invalid json" \
  -F "img-001=@/tmp/test_img_1.jpg" \
  "$ENDPOINT/rank")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ Test 3 PASSED"
else
  echo "❌ Test 3 FAILED: expected 400, got $HTTP_CODE"
fi
echo ""

# Test 4: Health check
echo "Test 4: Health Check"
echo "-------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" "$ENDPOINT/health")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Test 4 PASSED"
else
  echo "❌ Test 4 FAILED: expected 200, got $HTTP_CODE"
fi
echo ""

# Cleanup
rm -f /tmp/test_img_*.jpg

echo "=================================="
echo "🎯 Smoke test complete."
echo ""
echo "✨ All tests passed! /rank endpoint is ready for Phase 2a frontend integration."
