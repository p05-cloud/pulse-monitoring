# PULSE Monitoring System - L1 Team Usage Guide

## Table of Contents
1. [System Access](#system-access)
2. [Creating Monitors](#creating-monitors)
3. [Monitor Types & Examples](#monitor-types--examples)
4. [Monitoring Private APIs](#monitoring-private-apis)
5. [Understanding Results](#understanding-results)
6. [Common Use Cases](#common-use-cases)
7. [Troubleshooting](#troubleshooting)

---

## System Access

### Web Dashboard
- **URL**: https://pulse-dashboard.onrender.com
- **Default Credentials**:
  - Email: `admin@pulse.local`
  - Password: `password`

⚠️ **Security**: Change the default password immediately after first login.

### API Endpoint
- **Base URL**: https://pulse-api-q7cs.onrender.com/api/v1
- **Authentication**: Bearer token (obtained from login)

---

## Creating Monitors

### Step-by-Step Process

1. **Navigate to Monitors Page**
   - Click "Monitors" in the sidebar
   - Click "Create Monitor" button

2. **Fill Required Fields**
   - **Monitor Name**: Descriptive name (e.g., "Production API Health")
   - **Project**: Select the project this monitor belongs to
   - **URL**: The endpoint to monitor (must be full URL with https://)
   - **HTTP Method**: GET, POST, PUT, PATCH, DELETE
   - **Interval**: How often to check (60-3600 seconds)
   - **Expected Status**: HTTP status code you expect (usually 200)

3. **Optional Fields**
   - **Timeout**: Max wait time in milliseconds (default 30000ms)
   - **Keyword**: Text to search for in response body
   - **Request Body**: JSON or plain text for POST/PUT/PATCH/DELETE
   - **Tags**: Comma-separated tags (e.g., "production, critical, api")

4. **Click "Create Monitor"**

---

## Monitor Types & Examples

### 1. Simple GET Request (Public Website/API)

**Use Case**: Monitor a public health check endpoint

```
Monitor Name: Production Website Health
URL: https://api.example.com/health
Method: GET
Interval: 60 seconds
Expected Status: 200
Keyword: "healthy" (optional)
```

**What happens**:
- System sends `GET https://api.example.com/health` every 60 seconds
- Checks if response status is 200
- Optionally checks if response contains "healthy"

---

### 2. POST Request with Body (API Health Check)

**Use Case**: Monitor an API that requires POST with specific payload

```
Monitor Name: Payment Service Health
URL: https://payment-api.internal.com/v1/health
Method: POST
Expected Status: 200
Request Body:
{
  "service": "payment",
  "check": "detailed"
}
```

**What happens**:
- System sends POST request with the JSON body
- Checks if response status is 200

---

### 3. Private API with Authentication

**Use Case**: Monitor internal API requiring Bearer token

**⚠️ Important**: You need to configure headers in the database for now. Frontend headers support coming soon.

**Option 1: Using API directly**
```bash
curl -X POST https://pulse-api-q7cs.onrender.com/api/v1/monitors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "name": "Internal API Monitor",
    "url": "https://api.internal.com/health",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer internal-api-token-123",
      "X-API-Key": "secret-key"
    },
    "body": "{\"check\": \"health\"}",
    "expectedStatus": 200
  }'
```

**Option 2: Using Prisma Studio** (for now, until frontend headers UI is added)
1. Navigate to http://localhost:5555 (local) or use Render dashboard
2. Find your monitor in the `monitors` table
3. Edit the `headers` field (JSON format):
```json
{
  "Authorization": "Bearer your-internal-token",
  "X-API-Key": "your-api-key"
}
```

---

### 4. GraphQL Endpoint

**Use Case**: Monitor a GraphQL API

```
Monitor Name: GraphQL Users Query
URL: https://api.example.com/graphql
Method: POST
Expected Status: 200
Request Body:
{
  "query": "{ users { id name } }"
}
Headers (via API/DB):
{
  "Content-Type": "application/json",
  "Authorization": "Bearer graphql-token"
}
```

---

### 5. REST API with Complex Body

**Use Case**: Monitor a user creation endpoint

```
Monitor Name: User Creation API
URL: https://api.example.com/v1/users
Method: POST
Expected Status: 201
Request Body:
{
  "email": "test@example.com",
  "name": "Test User",
  "role": "viewer"
}
```

---

## Monitoring Private APIs

### Authentication Methods Supported

#### 1. Bearer Token Authentication
```json
Headers:
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. API Key Authentication
```json
Headers:
{
  "X-API-Key": "sk_live_abc123...",
  "X-Client-ID": "client_123"
}
```

#### 3. Basic Authentication
```json
Headers:
{
  "Authorization": "Basic dXNlcjpwYXNzd29yZA=="
}
```
*(Note: Basic auth header is base64 encoded "username:password")*

#### 4. Custom Headers
```json
Headers:
{
  "X-Custom-Auth": "custom-value",
  "X-Tenant-ID": "tenant-123"
}
```

---

## Understanding Results

### Monitor Statuses

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| **UP** | Working correctly | None |
| **DOWN** | Failed health check | Investigate immediately |
| **UNKNOWN** | Not checked yet | Wait for first check |
| **DEGRADED** | Intermittent failures | Monitor closely |

### Check Results

Each check creates a result with:
- **Response Time**: How long the request took (ms)
- **Status Code**: HTTP status returned
- **Success/Failure**: Whether check passed
- **RCA Details**: Root Cause Analysis (DNS, TCP, TLS, HTTP phases)

### Incidents

An incident is created when:
- Monitor goes from UP → DOWN (3 consecutive failures)
- Incident severity based on monitor configuration
- Notifications sent to configured alert contacts

---

## Common Use Cases

### Use Case 1: Monitor Production Website
```
Name: Production Homepage
URL: https://www.example.com
Method: GET
Interval: 60 seconds
Expected Status: 200
Keyword: "Welcome" (checks homepage loads correctly)
Tags: production, frontend, critical
```

### Use Case 2: Monitor Microservice Health
```
Name: User Service Health
URL: https://users-api.internal.com/health
Method: POST
Interval: 120 seconds
Expected Status: 200
Body: {"service": "users"}
Headers: {"Authorization": "Bearer internal-token"}
Tags: production, microservice, backend
```

### Use Case 3: Monitor Database Connection
```
Name: Database Health Check
URL: https://api.internal.com/health/database
Method: GET
Interval: 300 seconds (5 minutes)
Expected Status: 200
Keyword: "connected"
Tags: production, database, critical
```

### Use Case 4: Monitor Third-Party API
```
Name: Stripe API Health
URL: https://api.stripe.com/v1/customers
Method: GET
Expected Status: 401 (expected unauthorized without key)
Headers: {"Authorization": "Bearer sk_test_xxx"}
Interval: 600 seconds (10 minutes)
Tags: external, payment, integration
```

### Use Case 5: Monitor Authentication Endpoint
```
Name: Login API Health
URL: https://auth.example.com/v1/login
Method: POST
Expected Status: 200
Body:
{
  "email": "healthcheck@example.com",
  "password": "healthcheck-password"
}
Keyword: "token" (checks token is returned)
Tags: production, auth, critical
```

---

## Troubleshooting

### Monitor Shows DOWN but Service is UP

**Possible Causes:**
1. **Incorrect Expected Status**: Check if API returns different status code
2. **Authentication Failed**: Verify headers/tokens are correct
3. **Keyword Not Found**: Response changed, keyword no longer present
4. **Timeout Too Low**: Increase timeout if API is slow
5. **Request Body Invalid**: Check JSON format in body field

**Solution Steps:**
1. Check latest check result for error details
2. Review RCA (Root Cause Analysis) phases:
   - DNS failure → DNS issues
   - TCP failure → Network/firewall issues
   - TLS failure → Certificate problems
   - HTTP failure → Application issues
3. Test endpoint manually with same parameters
4. Update monitor configuration if needed

### Monitor Not Running

**Check:**
1. Is monitor active? (Check `isActive` field)
2. Is project active?
3. Check server logs for errors
4. Verify check scheduler is running

### False Positives

**Common Issues:**
- Expected status too strict (use 2xx range if possible)
- Keyword too specific (response format changed)
- Timeout too aggressive for slow endpoints

**Solutions:**
- Adjust expected status
- Remove or update keyword
- Increase timeout
- Increase interval for slow endpoints

---

## Request Body Format Guide

### JSON Body
```json
{
  "key": "value",
  "nested": {
    "field": "value"
  },
  "array": [1, 2, 3]
}
```

### Plain Text Body
```
Plain text content
Can be multiline
```

### URL Encoded (as string)
```
username=test&password=test123&grant_type=client_credentials
```

### XML (as string)
```xml
<?xml version="1.0"?>
<health>
  <status>ok</status>
</health>
```

---

## Best Practices

### Intervals
- **Critical Services**: 60 seconds
- **Important Services**: 120-300 seconds
- **Non-Critical**: 300-600 seconds
- **External APIs**: 600+ seconds (respect rate limits)

### Naming Convention
```
[Environment] [Service] [Type]
Examples:
- Production API Health
- Staging Database Check
- Dev Frontend Homepage
```

### Tags
Use consistent tags:
- **Environment**: production, staging, dev
- **Type**: api, frontend, database, microservice
- **Criticality**: critical, important, low-priority
- **Team**: platform, frontend, backend, devops

### Security
- Never commit API keys/tokens to git
- Rotate tokens regularly
- Use service accounts for monitoring (not personal tokens)
- Limit token permissions to read-only where possible

---

## Support & Questions

For issues or questions:
1. Check monitor check results and RCA details
2. Review this guide
3. Contact platform team
4. Check API logs in Render dashboard

**System Health**: Check `/health` endpoint
- API: https://pulse-api-q7cs.onrender.com/health
- Web: https://pulse-dashboard.onrender.com

---

## Quick Reference

### Monitor Creation Checklist
- [ ] Descriptive name
- [ ] Correct project selected
- [ ] Valid URL (https://)
- [ ] Appropriate HTTP method
- [ ] Correct expected status
- [ ] Request body (if POST/PUT/DELETE)
- [ ] Authentication headers (if private API)
- [ ] Reasonable interval (60-600s)
- [ ] Relevant tags added

### Common HTTP Status Codes
- **200 OK**: Success (GET, PUT)
- **201 Created**: Success (POST creation)
- **204 No Content**: Success (DELETE)
- **400 Bad Request**: Invalid request body/params
- **401 Unauthorized**: Missing/invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Endpoint doesn't exist
- **500 Internal Server Error**: Server-side error
- **503 Service Unavailable**: Service down/overloaded

---

**Last Updated**: 2026-02-07
**Version**: 1.0.0
