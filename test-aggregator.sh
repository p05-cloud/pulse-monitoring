#!/bin/bash

# Test Aggregator Monitor - Run from project root
# Usage: ./test-aggregator.sh

API_URL="http://localhost:3001/api/v1"

echo "==================================="
echo "Testing Aggregator Monitor Feature"
echo "==================================="

# Step 1: Login and get token
echo ""
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pulse.local",
    "password": "password"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Check if API is running on port 4000"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"

# Step 2: Get project ID
echo ""
echo "Step 2: Getting project ID..."
PROJECTS_RESPONSE=$(curl -s -X GET "$API_URL/projects" \
  -H "Authorization: Bearer $TOKEN")

PROJECT_ID=$(echo $PROJECTS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ No projects found. Run: npm run db:seed"
  exit 1
fi

echo "✅ Using project: $PROJECT_ID"

# Step 3: Create Aggregator Monitor
echo ""
echo "Step 3: Creating aggregator monitor..."
MONITOR_RESPONSE=$(curl -s -X POST "$API_URL/monitors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "name": "Lambda API Aggregator - Test",
    "url": "https://your-lambda-url.execute-api.region.amazonaws.com/prod/check-apis",
    "method": "GET",
    "intervalSeconds": 300,
    "timeoutMs": 30000,
    "expectedStatus": 200,
    "tags": ["aggregator", "lambda", "test"],
    "monitorType": "AGGREGATOR",
    "aggregatorConfig": {
      "arrayPath": "all_apis",
      "nameField": "name",
      "statusField": "status",
      "statusCodeField": "status_code",
      "responseTimeField": "response_time_ms",
      "successValues": ["up", "healthy", "ok"]
    }
  }')

MONITOR_ID=$(echo $MONITOR_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$MONITOR_ID" ]; then
  echo "❌ Failed to create monitor"
  echo "Response: $MONITOR_RESPONSE"
  exit 1
fi

echo "✅ Monitor created: $MONITOR_ID"

# Step 4: Wait for check (or trigger manually)
echo ""
echo "Step 4: Waiting for check to run..."
echo "⏳ Checks run every 5 minutes. To speed up:"
echo "   Option A: Restart API (Ctrl+C in Terminal 1, then npm run dev:api)"
echo "   Option B: Wait 5 minutes"
echo ""
echo "Press Enter after restarting API or after 5 minutes..."
read

# Step 5: Get check results
echo ""
echo "Step 5: Fetching check results..."
CHECKS_RESPONSE=$(curl -s -X GET "$API_URL/monitors/$MONITOR_ID/checks?limit=20" \
  -H "Authorization: Bearer $TOKEN")

echo "$CHECKS_RESPONSE" | grep -o '"subMonitorName":"[^"]*' | cut -d'"' -f4

SUB_MONITOR_COUNT=$(echo "$CHECKS_RESPONSE" | grep -o '"subMonitorName"' | wc -l)

if [ "$SUB_MONITOR_COUNT" -gt 0 ]; then
  echo ""
  echo "✅ SUCCESS! Found $SUB_MONITOR_COUNT sub-monitors"
  echo ""
  echo "Sub-monitors detected:"
  echo "$CHECKS_RESPONSE" | python3 -m json.tool 2>/dev/null | grep -A 3 "subMonitorName" || echo "$CHECKS_RESPONSE"
else
  echo ""
  echo "⚠️  No sub-monitors found yet. Check API logs in Terminal 1 for errors."
fi

# Step 6: Check monitor status
echo ""
echo "Step 6: Monitor overview..."
MONITOR_DETAILS=$(curl -s -X GET "$API_URL/monitors/$MONITOR_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$MONITOR_DETAILS" | python3 -m json.tool 2>/dev/null || echo "$MONITOR_DETAILS"

echo ""
echo "==================================="
echo "Test Complete!"
echo "==================================="
echo ""
echo "Monitor ID: $MONITOR_ID"
echo "View in browser: http://localhost:5173/monitors/$MONITOR_ID"
echo ""
echo "To delete test monitor:"
echo "curl -X DELETE \"$API_URL/monitors/$MONITOR_ID\" -H \"Authorization: Bearer $TOKEN\""
echo ""
