# PULSE API Setup Guide

## Quick Start (Automated)

The fastest way to get started:

```bash
cd apps/api
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:
1. Install all npm dependencies
2. Create `.env` from template
3. Start Docker services (PostgreSQL + Redis)
4. Run database migrations
5. Apply performance indexes
6. Optionally seed sample data

---

## Manual Setup

If you prefer to run steps manually:

### 1. Install Dependencies

```bash
cd apps/api
npm install
```

**New packages added in Phases 4-6:**
- `nodemailer` - Email notifications
- `pdfkit` - PDF report generation
- `exceljs` - Excel report generation
- `@types/nodemailer`, `@types/pdfkit`, `@types/node-cron` - TypeScript types

### 2. Configure Environment

```bash
# Copy example env file
cp ../../.env.example .env

# Edit .env and configure:
nano .env
```

**Critical settings to update:**

```bash
# Database (default works with Docker)
DATABASE_URL=postgresql://pulse:pulse_dev_password@localhost:5432/pulse

# JWT Secret (change to something secure!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email notifications (REQUIRED for Phase 4)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password    # Use app-specific password!
SMTP_FROM=Pulse Monitoring <noreply@pulse.local>
```

#### Gmail Setup

1. Go to Google Account Settings
2. Security → 2-Step Verification (must be enabled)
3. App Passwords → Generate new app password
4. Use that 16-character password in `SMTP_PASSWORD`

### 3. Start Docker Services

```bash
cd ../..  # Back to project root
docker-compose up -d
```

Verify services are running:
```bash
docker-compose ps
```

You should see:
- `pulse-postgres` - Running on port 5432
- `pulse-redis` - Running on port 6379
- `pulse-redis-ui` - Running on port 8081 (optional)

### 4. Run Database Migrations

```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy
```

### 5. Apply Performance Indexes

```bash
# Run the SQL script
psql -U pulse -d pulse -h localhost -f scripts/add-indexes.sql

# Password: pulse_dev_password
```

This creates 30+ indexes for optimal performance on:
- Monitor lookups
- Check result queries
- Incident searches
- Time-based queries
- Tag searches (GIN indexes)

### 6. Seed Database (Optional)

```bash
npx tsx scripts/seed.ts
```

Creates:
- 3 users (admin@pulse.local, user1@pulse.local, user2@pulse.local)
- 3 projects (Production, Staging, Development)
- 10+ monitors across projects
- 2 alert contacts (email, Teams)
- Sample check results and incidents

**Login credentials:**
- Email: `admin@pulse.local`
- Password: `password`

---

## Verification

### Test Database Connection

```bash
npx prisma studio
```

Opens database viewer at http://localhost:5555

### Test Redis Connection

```bash
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Test Server Start

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

### Test Health Endpoint

```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Test Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pulse.local",
    "password": "password"
  }'
```

Should return JWT token.

---

## Testing Email Notifications

### 1. Create Alert Contact

```bash
curl -X POST http://localhost:3001/api/v1/alert-contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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

### 2. Test Notification

```bash
curl -X POST http://localhost:3001/api/v1/alert-contacts/CONTACT_ID/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Should send a test email.

### 3. Monitor with Alert

Create a monitor with a bad URL to trigger incident:

```bash
curl -X POST http://localhost:3001/api/v1/monitors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "name": "Test Monitor",
    "url": "https://httpstat.us/500",
    "method": "GET",
    "intervalSeconds": 60,
    "alertContactIds": ["CONTACT_ID"]
  }'
```

Wait 3 minutes (3 consecutive failures) to receive DOWN notification.

---

## Testing MS Teams Notifications

### 1. Create Incoming Webhook in Teams

1. Open Teams channel
2. Click "..." → Connectors → Incoming Webhook
3. Name it "Pulse Monitoring"
4. Copy webhook URL

### 2. Create Teams Alert Contact

```bash
curl -X POST http://localhost:3001/api/v1/alert-contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dev Team Channel",
    "type": "TEAMS",
    "config": {
      "webhookUrl": "https://outlook.office.com/webhook/..."
    },
    "isActive": true
  }'
```

### 3. Test Teams Notification

```bash
curl -X POST http://localhost:3001/api/v1/alert-contacts/CONTACT_ID/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Should post adaptive card to Teams channel.

---

## Testing Reports

### 1. Create Report Schedule

```bash
curl -X POST http://localhost:3001/api/v1/reports/schedules \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Production Report",
    "frequency": "DAILY",
    "projectIds": ["PROJECT_ID"],
    "recipients": ["your-email@example.com"],
    "format": "PDF",
    "isActive": true
  }'
```

### 2. Generate On-Demand Report

```bash
curl -X POST http://localhost:3001/api/v1/reports/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Report",
    "format": "CSV",
    "projectIds": [],
    "recipients": ["your-email@example.com"],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

Report will be generated in background and emailed when complete.

---

## Troubleshooting

### PostgreSQL Connection Failed

```bash
# Check if running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Redis Connection Failed

```bash
# Check if running
docker-compose exec redis redis-cli ping

# View logs
docker-compose logs redis
```

### Email Not Sending

1. Check SMTP settings in `.env`
2. For Gmail, ensure you're using App Password (not regular password)
3. Check logs: `docker-compose logs api`
4. Test SMTP manually:
   ```bash
   npx nodemailer-cli \
     --host smtp.gmail.com \
     --port 587 \
     --user your-email@gmail.com \
     --password your-app-password \
     --to test@example.com \
     --subject "Test" \
     --body "Testing SMTP"
   ```

### Workers Not Processing Jobs

```bash
# Check Redis queue
docker-compose exec redis redis-cli

# In redis-cli:
> KEYS bull:*
> LLEN bull:check-queue:wait
> LLEN bull:notification-queue:wait
```

### Performance Issues

```bash
# Ensure indexes are applied
psql -U pulse -d pulse -h localhost -c "\di"

# Should show 30+ indexes including:
# - idx_monitors_project_active
# - idx_check_results_monitor_time
# - idx_incidents_active
```

---

## Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to secure random value
- [ ] Update `DATABASE_URL` to production database
- [ ] Configure production SMTP service
- [ ] Set `NODE_ENV=production`
- [ ] Enable Redis password: `REDIS_PASSWORD=...`
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Review data retention policies
- [ ] Configure backup strategy
- [ ] Test disaster recovery

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PULSE API                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Check    │  │   Report   │  │  Cleanup   │        │
│  │ Scheduler  │  │ Scheduler  │  │   Worker   │        │
│  │ (1 minute) │  │  (hourly)  │  │ (daily 2AM)│        │
│  └────────────┘  └────────────┘  └────────────┘        │
│         │               │               │               │
│         ▼               ▼               ▼               │
│  ┌─────────────────────────────────────────────┐       │
│  │           BullMQ Job Queues                 │       │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    │       │
│  │  │Check │  │Notif │  │Report│  │Other │    │       │
│  │  │Queue │  │Queue │  │Queue │  │Jobs  │    │       │
│  │  └──────┘  └──────┘  └──────┘  └──────┘    │       │
│  └─────────────────────────────────────────────┘       │
│         │               │               │               │
│         ▼               ▼               ▼               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │   Check    │  │Notification│  │   Report   │       │
│  │   Worker   │  │   Worker   │  │   Worker   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│         │               │               │               │
│         ▼               ▼               ▼               │
│  ┌─────────────────────────────────────────────┐       │
│  │            PostgreSQL Database              │       │
│  │  • Monitors    • Incidents  • Reports       │       │
│  │  • Checks      • Alerts     • Activity      │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ API is ready for development
2. Move to frontend: `cd ../web` and set up React dashboard
3. Configure monitoring endpoints
4. Set up CI/CD pipeline
5. Deploy to production (Phase 7 - when ready)

---

**Need help?** Check the main [CLAUDE.md](../../CLAUDE.md) for complete project documentation.
