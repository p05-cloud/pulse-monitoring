# API Testing Guide

Complete guide for testing all Pulse API endpoints.

## Setup

1. Ensure Docker containers are running:
```bash
docker-compose up -d
```

2. Ensure API server is running:
```bash
npm run dev:api
```

3. Get an authentication token:
```bash
# Login as admin
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulse.local","password":"password"}' | jq

# Save the token
export TOKEN="<paste-token-here>"
```

## Authentication Endpoints

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pulse.local",
    "password": "password"
  }' | jq
```

### Get Current User
```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Refresh Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<your-refresh-token>"}' | jq
```

## Project Endpoints

### List All Projects
```bash
curl http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Get Project by ID
```bash
PROJECT_ID="<project-id>"
curl http://localhost:3001/api/v1/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Create Project
```bash
curl -X POST http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "QA Environment",
    "description": "QA testing environment",
    "color": "#9333EA"
  }' | jq
```

### Update Project
```bash
curl -X PUT http://localhost:3001/api/v1/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "QA Updated",
    "description": "Updated description"
  }' | jq
```

### Get Project Health
```bash
curl http://localhost:3001/api/v1/projects/$PROJECT_ID/health \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Delete Project
```bash
curl -X DELETE http://localhost:3001/api/v1/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Monitor Endpoints

### List All Monitors
```bash
curl http://localhost:3001/api/v1/monitors \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Filter Monitors by Status
```bash
# Get DOWN monitors
curl "http://localhost:3001/api/v1/monitors?status=DOWN" \
  -H "Authorization: Bearer $TOKEN" | jq

# Get UP monitors
curl "http://localhost:3001/api/v1/monitors?status=UP" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Filter by Project
```bash
curl "http://localhost:3001/api/v1/monitors?projectId=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Filter by Tags
```bash
# Single tag
curl "http://localhost:3001/api/v1/monitors?tags=critical" \
  -H "Authorization: Bearer $TOKEN" | jq

# Multiple tags (must have ALL tags)
curl "http://localhost:3001/api/v1/monitors?tags=critical,api" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Create Monitor
```bash
curl -X POST http://localhost:3001/api/v1/monitors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "name": "My New API",
    "url": "https://api.example.com/health",
    "method": "GET",
    "intervalSeconds": 60,
    "timeoutMs": 30000,
    "expectedStatus": 200,
    "tags": ["api", "production"],
    "headers": {
      "User-Agent": "Pulse-Monitor"
    }
  }' | jq
```

### Get Monitor Details
```bash
MONITOR_ID="<monitor-id>"
curl http://localhost:3001/api/v1/monitors/$MONITOR_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Update Monitor
```bash
curl -X PUT http://localhost:3001/api/v1/monitors/$MONITOR_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Monitor Name",
    "intervalSeconds": 300
  }' | jq
```

### Pause Monitor
```bash
curl -X POST http://localhost:3001/api/v1/monitors/$MONITOR_ID/pause \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Resume Monitor
```bash
curl -X POST http://localhost:3001/api/v1/monitors/$MONITOR_ID/resume \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Get Check History
```bash
curl "http://localhost:3001/api/v1/monitors/$MONITOR_ID/checks?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Get Incident History
```bash
curl http://localhost:3001/api/v1/monitors/$MONITOR_ID/incidents \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Delete Monitor
```bash
curl -X DELETE http://localhost:3001/api/v1/monitors/$MONITOR_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Alert Contact Endpoints

### List Alert Contacts
```bash
curl http://localhost:3001/api/v1/alert-contacts \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Create Email Alert Contact
```bash
curl -X POST http://localhost:3001/api/v1/alert-contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DevOps Email",
    "type": "EMAIL",
    "config": {
      "email": "devops@example.com"
    }
  }' | jq
```

### Create Teams Webhook
```bash
curl -X POST http://localhost:3001/api/v1/alert-contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teams Channel",
    "type": "TEAMS",
    "config": {
      "webhookUrl": "https://outlook.office.com/webhook/xxx"
    }
  }' | jq
```

### Test Notification
```bash
CONTACT_ID="<contact-id>"
curl -X POST http://localhost:3001/api/v1/alert-contacts/$CONTACT_ID/test \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Update Alert Contact
```bash
curl -X PUT http://localhost:3001/api/v1/alert-contacts/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Contact Name",
    "isActive": false
  }' | jq
```

### Delete Alert Contact
```bash
curl -X DELETE http://localhost:3001/api/v1/alert-contacts/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

## User Endpoints (Admin Only)

### List Users
```bash
curl http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Create User
```bash
curl -X POST http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@pulse.local",
    "password": "password123",
    "name": "New User",
    "role": "USER"
  }' | jq
```

### Update User
```bash
USER_ID="<user-id>"
curl -X PUT http://localhost:3001/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "isActive": true
  }' | jq
```

### Delete User
```bash
curl -X DELETE http://localhost:3001/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Error Testing

### Test Unauthorized Access (No Token)
```bash
curl http://localhost:3001/api/v1/projects
# Should return 401 Unauthorized
```

### Test Invalid Credentials
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulse.local","password":"wrongpassword"}' | jq
# Should return 401 with "Invalid email or password"
```

### Test Validation Error
```bash
curl -X POST http://localhost:3001/api/v1/monitors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test"
  }' | jq
# Should return 400 with validation errors
```

### Test Not Found
```bash
curl http://localhost:3001/api/v1/monitors/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $TOKEN" | jq
# Should return 404 Not Found
```

### Test Forbidden (User accessing admin endpoint)
```bash
# Login as regular user
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@pulse.local","password":"password"}' | jq

# Try to access admin endpoint
USER_TOKEN="<paste-user-token>"
curl http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer $USER_TOKEN" | jq
# Should return 403 Forbidden
```

## Pagination Testing

```bash
# Get first page (default 20 items)
curl "http://localhost:3001/api/v1/monitors?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq

# Get second page
curl "http://localhost:3001/api/v1/monitors?page=2&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Complex Filtering

```bash
# Combine multiple filters
curl "http://localhost:3001/api/v1/monitors?projectId=$PROJECT_ID&status=UP&tags=api&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Tips

1. Install `jq` for pretty JSON output:
```bash
brew install jq  # macOS
apt install jq   # Ubuntu
```

2. Save your token to avoid retyping:
```bash
export TOKEN="your-jwt-token-here"
```

3. Use Postman or Insomnia for a GUI experience

4. Check API logs for debugging:
```bash
# Server logs show in terminal where npm run dev:api is running
# Or check log files
tail -f apps/api/logs/all.log
```

5. Monitor database changes with Prisma Studio:
```bash
npm run db:studio
# Opens at http://localhost:5555
```

## Quick Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Pulse API..."

# Health check
echo "1. Health Check..."
curl -s http://localhost:3001/health | jq

# Login
echo "\n2. Login..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulse.local","password":"password"}')
echo $RESPONSE | jq

# Extract token
TOKEN=$(echo $RESPONSE | jq -r '.data.token')
echo "Token: ${TOKEN:0:50}..."

# Get projects
echo "\n3. Get Projects..."
curl -s http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, name}'

# Get monitors
echo "\n4. Get Monitors..."
curl -s http://localhost:3001/api/v1/monitors \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, name, status: .currentStatus}'

echo "\n✅ Tests complete!"
```

Run it:
```bash
chmod +x test-api.sh
./test-api.sh
```
