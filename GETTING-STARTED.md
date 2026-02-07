# Getting Started with PULSE

Complete setup guide to get PULSE running in 5 minutes.

## Prerequisites

✅ **Required:**
- Node.js 20+ ([Download](https://nodejs.org/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- Git

✅ **Optional:**
- PostgreSQL CLI tools (for manual database access)
- VS Code (recommended editor)

## Quick Start (5 Minutes)

### 1. Clone and Navigate

```bash
git clone <your-repo-url>
cd Pulse-App
```

### 2. Start Docker Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 16 on port 5432
- Redis 7 on port 6379
- Redis Commander (optional UI) on port 8081

Verify:
```bash
docker-compose ps
# All services should show "Up"
```

### 3. Setup Backend (Automated)

```bash
cd apps/api
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The setup script will:
1. ✅ Install all npm dependencies (including nodemailer, pdfkit, exceljs)
2. ✅ Create `.env` from template
3. ✅ Generate Prisma client
4. ✅ Run database migrations
5. ✅ Apply 30+ performance indexes
6. ✅ Optionally seed sample data (say "yes")

### 4. Configure Email (Important!)

PULSE uses [Resend](https://resend.com) - much simpler than SMTP!

**Quick Setup:**

1. **Get Resend API Key** (2 minutes):
   - Go to https://resend.com and sign up (free)
   - Click **API Keys** → **Create API Key**
   - Copy the key (starts with `re_`)

2. **Add to `.env`**:
   ```bash
   cd apps/api
   nano .env
   ```

3. **Update these lines**:
   ```bash
   RESEND_API_KEY=re_your_actual_api_key_here
   EMAIL_FROM=PULSE Monitoring <onboarding@resend.dev>
   ```

**That's it!** No SMTP configuration needed.

**Free Tier**: 3,000 emails/month (more than enough for monitoring)

For detailed setup, see [RESEND-SETUP.md](RESEND-SETUP.md)

### 5. Start Backend

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Redis connected successfully
✅ All workers running
  - Check Worker: Processing check queue
  - Notification Worker: Processing notification queue
  - Report Worker: Processing report queue
  - Cleanup Worker: Scheduled for daily cleanup
🚀 Pulse API server running on port 3001

📊 Full system active:
  - ✓ Check Scheduler: Every minute
  - ✓ Report Scheduler: Hourly
  - ✓ Cleanup Worker: Daily at 2 AM
  - ✓ Incident Detection: 3-failure rule
  - ✓ Notifications: Email, Teams, Webhook
  - ✓ Reports: PDF, Excel, CSV
  - ✓ Maintenance Windows: Active
  - ✓ Data Retention: 7-day check history
```

### 6. Test API

Open new terminal:
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 7. Setup Frontend (Optional)

```bash
cd apps/web
npm install
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

**Login:**
- Email: `admin@pulse.local`
- Password: `password`

---

## Verification Checklist

Run this to verify everything is configured correctly:

```bash
cd apps/api
chmod +x scripts/verify-setup.sh
./scripts/verify-setup.sh
```

This checks:
- ✅ All npm packages installed
- ✅ Environment variables configured
- ✅ Docker services running
- ✅ Database migrations applied
- ✅ Performance indexes created
- ✅ Critical files present

---

## First Steps After Setup

### 1. Create Your First Monitor

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulse.local","password":"password"}' \
  | jq -r '.data.token')

# Get project ID
PROJECT_ID=$(curl -s http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data[0].id')

# Create monitor
curl -X POST http://localhost:3001/api/v1/monitors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"name\": \"My Website\",
    \"url\": \"https://example.com\",
    \"method\": \"GET\",
    \"intervalSeconds\": 60,
    \"expectedStatus\": 200
  }"
```

### 2. Create Email Alert Contact

```bash
curl -X POST http://localhost:3001/api/v1/alert-contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Email",
    "type": "EMAIL",
    "config": {
      "email": "your-email@example.com"
    },
    "isActive": true
  }'
```

### 3. Test Email Notification

```bash
CONTACT_ID=$(curl -s http://localhost:3001/api/v1/alert-contacts \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data[0].id')

curl -X POST http://localhost:3001/api/v1/alert-contacts/$CONTACT_ID/test \
  -H "Authorization: Bearer $TOKEN"

# Check your email for test notification!
```

### 4. Generate Test Report

```bash
curl -X POST http://localhost:3001/api/v1/reports/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Report",
    "format": "CSV",
    "projectIds": [],
    "recipients": ["your-email@example.com"],
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }'

# Report will be generated in background and emailed
```

---

## Monitoring the System

### Watch Check Activity

```bash
# In apps/api directory
tail -f logs/all.log | grep "Check"
```

You'll see:
- `📋 Scheduled X checks` (every minute)
- `Monitor xxx: UP (245ms)`
- `Monitor xxx: DOWN - DNS_FAILURE`
- `🚨 Incident created for monitor xxx`

### Watch Queue Activity

```bash
# Redis Commander
open http://localhost:8081

# Or use Redis CLI
docker-compose exec redis redis-cli
> KEYS bull:*
> LLEN bull:check-queue:wait
> LLEN bull:notification-queue:wait
```

### View Database

```bash
cd apps/api
npx prisma studio
# Opens at http://localhost:5555
```

---

## Common Tasks

### Add Monitor from CSV

Create `monitors.csv`:
```csv
Name,URL,Method,Interval (seconds),Timeout (ms),Expected Status,Project,Tags,Active
Google,https://google.com,GET,60,30000,200,Production,"search;critical",true
GitHub,https://github.com,GET,300,30000,200,Production,"vcs",true
```

Import:
```bash
curl -X POST http://localhost:3001/api/v1/monitors/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @monitors.csv
```

### Create Maintenance Window

```bash
curl -X POST http://localhost:3001/api/v1/maintenance-windows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekend Maintenance",
    "monitorIds": ["monitor-id-1", "monitor-id-2"],
    "startTime": "2024-02-10T02:00:00Z",
    "endTime": "2024-02-10T06:00:00Z",
    "recurring": false
  }'
```

### Schedule Weekly Report

```bash
curl -X POST http://localhost:3001/api/v1/reports/schedules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Production Report",
    "frequency": "WEEKLY",
    "projectIds": ["production-project-id"],
    "recipients": ["team@example.com"],
    "format": "PDF",
    "isActive": true
  }'
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check Docker services
docker-compose ps

# Restart if needed
docker-compose restart postgres redis

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

### Email Not Sending

1. **Check SMTP configuration** in `.env`
2. **For Gmail**: Use App Password, not regular password
3. **Test SMTP manually**:
   ```bash
   npx nodemailer-cli \
     --host smtp.gmail.com \
     --port 587 \
     --secure false \
     --user your-email@gmail.com \
     --password your-app-password \
     --to test@example.com \
     --subject "Test" \
     --body "Testing SMTP"
   ```
4. **Check backend logs** for SMTP errors

### Workers Not Processing

```bash
# Check Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Check queue lengths
docker-compose exec redis redis-cli
> LLEN bull:check-queue:wait
> LLEN bull:notification-queue:wait

# Restart backend
# (Ctrl+C in terminal running npm run dev)
npm run dev
```

### Database Connection Error

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready
# Should return: accepting connections

# Reset database if needed
npx prisma migrate reset

# Re-run setup
./scripts/setup.sh
```

### Performance Issues

Make sure indexes are applied:
```bash
psql -U pulse -d pulse -h localhost -f scripts/add-indexes.sql
# Password: pulse_dev_password
```

---

## What's Next?

✅ **System is running!** Here's what you can do:

1. **Explore the Dashboard**
   - Visit http://localhost:3000
   - View monitors, incidents, projects
   - Check real-time status updates

2. **Test Incident Flow**
   - Create monitor with bad URL (`https://httpstat.us/500`)
   - Wait 3 minutes for 3 failures
   - Receive DOWN notification email
   - Fix URL or delete monitor
   - Receive UP notification

3. **Try Bulk Operations**
   - Export monitors to CSV
   - Import monitors from CSV
   - Bulk pause/resume monitors

4. **Schedule Reports**
   - Create daily/weekly/monthly schedules
   - Generate on-demand reports
   - Receive via email

5. **Enterprise Features**
   - Create maintenance windows
   - Configure data retention
   - View audit logs
   - Manage user roles

---

## Production Deployment

When ready for production:

1. **Update Configuration**
   - Change `JWT_SECRET` to secure random value
   - Use production database URL
   - Configure production SMTP
   - Set `NODE_ENV=production`
   - Enable Redis authentication

2. **Security**
   - Set up SSL/TLS certificates
   - Configure rate limiting
   - Review CORS settings
   - Implement backups

3. **Monitoring**
   - Set up error tracking (Sentry, etc.)
   - Configure uptime monitoring for PULSE itself
   - Set up log aggregation

4. **Scaling**
   - Horizontal scaling of workers
   - Database connection pooling
   - Redis clustering
   - Load balancing

5. **AWS Deployment** (Phase 7 - when ready)
   - ECS Fargate for containers
   - RDS for PostgreSQL
   - ElastiCache for Redis
   - ALB for load balancing
   - Terraform for infrastructure

---

## Need Help?

- **Setup Issues**: See [apps/api/SETUP.md](apps/api/SETUP.md)
- **API Documentation**: See [IMPLEMENTATION-COMPLETE.md](IMPLEMENTATION-COMPLETE.md)
- **Project Details**: See [CLAUDE.md](CLAUDE.md)
- **Architecture**: See main [README.md](README.md)

---

**You're all set!** 🚀

The PULSE monitoring platform is now running with:
- ✓ 1-minute interval checks
- ✓ Detailed RCA capture
- ✓ Email/Teams/Webhook notifications
- ✓ Scheduled reports
- ✓ Maintenance windows
- ✓ Data retention policies
- ✓ Performance optimizations

Happy monitoring! 📊
