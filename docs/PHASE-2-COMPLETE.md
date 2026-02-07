# 🎉 PHASE 2 COMPLETE: Check Engine & RCA

**Status:** ✅ **FULLY OPERATIONAL**

The monitoring core is now actively checking URLs, detecting incidents, and capturing detailed root cause analysis!

---

## ✅ What's Working

### 1. BullMQ Queue System
- ✅ **Check Queue** - Dispatches monitoring jobs
- ✅ **Notification Queue** - Ready for Phase 4
- ✅ **Report Queue** - Ready for Phase 5
- ✅ Redis-backed with retry logic
- ✅ Job persistence and failure handling

### 2. Check Scheduler
- ✅ **Cron-based** - Runs every minute
- ✅ **Interval-aware** - Respects each monitor's interval (60s, 300s, etc.)
- ✅ **Bulk dispatch** - Efficient job creation
- ✅ Automatic - Starts with server

### 3. HTTP Checker with Full RCA
- ✅ **DNS Resolution** - With timing
- ✅ **TCP Connection** - With timing
- ✅ **TLS/SSL Inspection** - Certificate validation
- ✅ **HTTP Request** - Full request/response capture
- ✅ **Keyword Validation** - Content checking
- ✅ **Detailed Timing** - Phase-by-phase breakdown
- ✅ **Error Categorization** - 18 RCA categories

### 4. RCA Categories Detected
```
DNS_FAILURE, DNS_TIMEOUT
CONNECTION_REFUSED, CONNECTION_TIMEOUT, CONNECTION_RESET
SSL_CERTIFICATE_EXPIRED, SSL_CERTIFICATE_INVALID
SSL_HOSTNAME_MISMATCH, SSL_HANDSHAKE_FAILED
HTTP_4XX, HTTP_5XX, HTTP_UNEXPECTED_STATUS
TIMEOUT, KEYWORD_MISSING
EMPTY_RESPONSE, INVALID_RESPONSE
NETWORK_ERROR, UNKNOWN_ERROR
```

### 5. Check Worker
- ✅ **Concurrent Processing** - Handles 10 checks simultaneously
- ✅ **Rate Limited** - 100 jobs/second max
- ✅ **Auto-retry** - 3 attempts with exponential backoff
- ✅ **Result Storage** - All checks saved to database
- ✅ **Status Updates** - Real-time monitor status

### 6. Incident Detection
- ✅ **3-Failure Rule** - 3 consecutive failures = incident
- ✅ **Auto-Create** - Incidents created automatically
- ✅ **Auto-Resolve** - Incidents resolved when monitor recovers
- ✅ **Duration Tracking** - Calculates downtime
- ✅ **RCA Capture** - Full root cause saved
- ✅ **Activity Logging** - All incidents logged

### 7. Incident Management API
- ✅ `GET /api/v1/incidents` - List incidents (with filtering)
- ✅ `GET /api/v1/incidents/:id` - View incident details + RCA
- ✅ `POST /api/v1/incidents/:id/acknowledge` - Acknowledge incident
- ✅ `POST /api/v1/incidents/:id/resolve` - Manually resolve
- ✅ `PUT /api/v1/incidents/:id/notes` - Add notes

---

## 📊 What You Can See Right Now

### Check the Logs
```bash
# Watch checks happening in real-time
tail -f apps/api/logs/all.log
```

You'll see:
- ✅ Checks being dispatched every minute
- ✅ Monitors being checked (UP/DOWN status)
- ✅ Response times (e.g., "Monitor xxx: UP (245ms)")
- ✅ Incidents being created for failures

### Query Active Incidents
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulse.local","password":"password"}' | jq -r '.data.token')

# Get all incidents
curl -s "http://localhost:3001/api/v1/incidents" \
  -H "Authorization: Bearer $TOKEN" | jq

# Get open incidents only
curl -s "http://localhost:3001/api/v1/incidents?status=OPEN" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### View Check Results
```bash
# Get check history for a monitor
MONITOR_ID="<paste-monitor-id>"

curl -s "http://localhost:3001/api/v1/monitors/$MONITOR_ID/checks?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### View in Prisma Studio
```bash
npm run db:studio
# Open http://localhost:5555
```

Navigate to:
- **check_results** - See all checks with RCA details
- **incidents** - See auto-created incidents
- **monitors** - See updated statuses and last_check_at times

---

## 🧪 Testing the System

### Test 1: Watch Checks Happen
```bash
# In one terminal, watch logs
tail -f apps/api/logs/all.log | grep "Check"

# You should see (every minute):
# "📋 Scheduled 10 checks"
# "Check completed for monitor xxx"
# "Monitor xxx: UP (123ms)" or "Monitor xxx: DOWN"
```

### Test 2: Create a Test Monitor
```bash
# Create a monitor that will fail
curl -X POST http://localhost:3001/api/v1/monitors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<project-id>",
    "name": "Test Failing Monitor",
    "url": "https://this-will-fail.example.com/test",
    "method": "GET",
    "intervalSeconds": 60,
    "timeoutMs": 5000,
    "expectedStatus": 200
  }' | jq

# Wait 3-4 minutes
# Check incidents - you should see a new incident!
curl -s "http://localhost:3001/api/v1/incidents?status=OPEN" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Test 3: View RCA Details
```bash
# Get an incident with full RCA
INCIDENT_ID="<paste-incident-id>"

curl -s "http://localhost:3001/api/v1/incidents/$INCIDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.rcaDetails'
```

You'll see detailed breakdown:
```json
{
  "category": "DNS_FAILURE",
  "message": "DNS resolution failed: getaddrinfo ENOTFOUND",
  "timestamp": "2026-02-02T...",
  "phases": {
    "dns": {
      "durationMs": 23,
      "success": false,
      "error": "getaddrinfo ENOTFOUND..."
    }
  },
  "totalDurationMs": 23
}
```

### Test 4: Acknowledge an Incident
```bash
curl -X POST "http://localhost:3001/api/v1/incidents/$INCIDENT_ID/acknowledge" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING FLOW                           │
└─────────────────────────────────────────────────────────────┘

Every Minute:
  1. ⏰ Check Scheduler (Cron)
       ↓
  2. 📋 Dispatches jobs to Check Queue (Redis/BullMQ)
       ↓
  3. ⚙️  Check Worker picks up jobs (10 concurrent)
       ↓
  4. 🔍 HTTP Checker executes check with RCA
       ├─ DNS Resolution (timing)
       ├─ TCP Connection (timing)
       ├─ TLS/SSL Inspection (timing)
       ├─ HTTP Request (timing)
       └─ Keyword Validation
       ↓
  5. 💾 Store CheckResult in database
       ↓
  6. 📊 Update Monitor status (UP/DOWN/DEGRADED)
       ↓
  7. 🚨 Incident Detector checks for:
       ├─ 3 consecutive failures → CREATE incident
       └─ Recovery after DOWN → RESOLVE incident
       ↓
  8. 📝 Log all activity
```

---

## 📁 Files Created (Phase 2)

### Orchestration Layer
- `orchestration/queues/queue.config.ts` - BullMQ configuration
- `orchestration/queues/check.queue.ts` - Check queue wrapper
- `orchestration/scheduler/check.scheduler.ts` - Cron-based scheduler

### Execution Layer
- `execution/checker/http.checker.ts` - HTTP checker with full RCA (350 lines!)
- `execution/workers/check.worker.ts` - Check job processor

### Director Layer
- `director/incidents/incident.detector.ts` - Incident creation/resolution logic
- `director/incidents/incident.service.ts` - Incident management
- `director/incidents/incident.controller.ts` - Incident API
- `director/incidents/incident.routes.ts` - Incident endpoints

**Total:** 9 new files, ~1000 lines of code

---

## 🎯 Success Metrics

All Phase 2 criteria met:

- ✅ Checks run automatically every minute
- ✅ HTTP checker captures DNS, TCP, TLS, HTTP timing
- ✅ RCA categorizes 18 different error types
- ✅ Check results stored in database
- ✅ Monitor status updates in real-time
- ✅ Incidents auto-created after 3 failures
- ✅ Incidents auto-resolved on recovery
- ✅ Incident API functional
- ✅ Activity logging working
- ✅ System runs continuously without intervention

---

## 📈 Monitoring Stats

Check current system status:

```bash
# Count total checks run
echo "SELECT COUNT(*) FROM check_results;" | \
  docker-compose exec -T postgres psql -U pulse -d pulse

# Count active incidents
echo "SELECT COUNT(*) FROM incidents WHERE status IN ('OPEN', 'ACKNOWLEDGED');" | \
  docker-compose exec -T postgres psql -U pulse -d pulse

# View monitor statuses
curl -s "http://localhost:3001/api/v1/monitors" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '.data[] | {name, currentStatus, lastCheckAt, consecutiveFailures}'
```

---

## 🔄 What Happens Automatically

### Every Minute
1. Scheduler fetches all active monitors
2. Filters monitors due for checking (based on interval)
3. Creates check jobs in queue
4. Worker processes jobs (10 at a time)
5. Results saved to database
6. Monitor statuses updated
7. Incidents detected/created/resolved

### On Failure
1. First failure: Status → DEGRADED (consecutive_failures = 1)
2. Second failure: Status → DEGRADED (consecutive_failures = 2)
3. Third failure: Status → DOWN, **INCIDENT CREATED** 🚨
4. RCA details captured in incident

### On Recovery
1. First success: Status → UP, consecutive_failures = 0
2. If there was an open incident: **INCIDENT RESOLVED** ✅
3. Duration calculated and stored

---

## 🚀 Next Steps

**Phase 2 is production-ready!** The monitoring core is fully functional.

### Optional Enhancements (Not Required)
- Dashboard graphs showing check history
- Incident timeline visualization
- Real-time WebSocket updates (Phase 3)
- Email/Teams notifications (Phase 4)

### Ready for Phase 3?
**Dashboard & UI** - Build the React interface to visualize all this data!

### Or Phase 4?
**Alerting & Notifications** - Get notified when incidents occur!

---

**Status: PHASE 2 COMPLETE ✅**
**Monitoring Engine: OPERATIONAL 🟢**
**Auto-Incident Detection: ACTIVE 🚨**

Built with Claude Code 🚀
