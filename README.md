# PULSE - Reliability Monitoring Platform

[![Phase 1](https://img.shields.io/badge/Phase%201-Complete-success)](docs/PHASE-1-COMPLETE.md)
[![Phase 2](https://img.shields.io/badge/Phase%202-Complete-success)](docs/PHASE-2-COMPLETE.md)
[![Phase 3](https://img.shields.io/badge/Phase%203-Complete-success)](docs/PHASE-3-COMPLETE.md)
[![Phase 4](https://img.shields.io/badge/Phase%204-Complete-success)](#phase-4-alerting--notifications-)
[![Phase 5](https://img.shields.io/badge/Phase%205-Complete-success)](#phase-5-reports--analytics-)
[![Phase 6](https://img.shields.io/badge/Phase%206-Complete-success)](#phase-6-enterprise-features-)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Enterprise-grade uptime monitoring platform with real-time alerts, detailed RCA, and beautiful dashboard

## 🎉 Current Status

**Phases 1-6 COMPLETE** - Production-ready monitoring platform!

- ✅ **Backend API** - Complete REST API with authentication, CRUD operations
- ✅ **Monitoring Engine** - Automatic checks every minute with RCA
- ✅ **Incident Detection** - 3-failure rule, auto-create and auto-resolve
- ✅ **React Dashboard** - Beautiful, responsive UI with real-time capabilities
- ✅ **Notifications** - Email, Teams, Webhook alerts with retry logic
- ✅ **Reports** - Scheduled PDF/Excel/CSV reports with email delivery
- ✅ **Enterprise** - Maintenance windows, bulk ops, data retention
- 🔄 **Phase 7 Ready** - AWS deployment with Terraform (when needed)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm 10+

### Installation

#### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/pulse.git
cd pulse

# Run automated setup script
cd apps/api
chmod +x scripts/setup.sh
./scripts/setup.sh

# Configure Resend API key in .env (for email notifications)
nano .env

# Start backend API
npm run dev

# In another terminal, start frontend
cd ../web
npm install
npm run dev
```

#### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/pulse.git
cd pulse

# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Setup backend
cd apps/api
npm install
npx prisma generate
npx prisma migrate deploy
psql -U pulse -d pulse -f scripts/add-indexes.sql
npx tsx scripts/seed.ts

# Configure .env
cp ../../.env.example .env
nano .env  # Add Resend API key

# Start backend API (port 3001)
npm run dev

# In another terminal, setup and start frontend
cd apps/web
npm install
npm run dev  # (port 3000)
```

### Access the Platform

- **Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3001](http://localhost:3001)
- **Prisma Studio**: Run `npm run db:studio` → [http://localhost:5555](http://localhost:5555)

**Default Login:**
- Email: `admin@pulse.local`
- Password: `password`

## 📊 Features

### Phase 1: Core Foundation ✅
- Monorepo architecture with TypeScript
- PostgreSQL database with Prisma ORM
- Redis for caching and job queues
- JWT authentication
- RESTful API with Express
- Complete CRUD operations for:
  - Users
  - Projects
  - Monitors
  - Alert Contacts

### Phase 2: Check Engine & RCA ✅
- **BullMQ Job Queues** - Reliable job processing
- **Cron Scheduler** - Checks every minute
- **HTTP Checker** - Full request lifecycle monitoring:
  - DNS resolution with timing
  - TCP connection with timing
  - TLS/SSL inspection with certificate validation
  - HTTP request/response capture
  - Keyword validation
- **Root Cause Analysis** - 18 error categories:
  - DNS failures and timeouts
  - Connection issues (refused, timeout, reset)
  - SSL/TLS problems (expired cert, invalid cert, mismatch)
  - HTTP errors (4xx, 5xx, unexpected status)
  - Timeouts, keyword missing, network errors
- **Incident Detection**:
  - 3 consecutive failures = incident created
  - Auto-resolve on recovery
  - Duration tracking
  - RCA capture

### Phase 3: Dashboard & UI ✅
- **React 18** with TypeScript
- **Vite** - Fast dev server and HMR
- **TailwindCSS** - Beautiful, responsive design
- **shadcn/ui** - Accessible component library
- **Authentication UI** - Login page with JWT
- **Dashboard** - Health summary, project health, activity log
- **Monitors Page** - Grid view with pause/resume/delete
- **Incidents Page** - Full RCA breakdown, acknowledge/resolve
- **Projects Page** - Project overview
- **WebSocket Ready** - Real-time update infrastructure
- **Mobile Responsive** - Works on all devices

### Phase 4: Alerting & Notifications ✅
- **Email Notifications** - Professional HTML templates via Resend API (3,000 free emails/month)
- **Microsoft Teams** - Adaptive cards with color-coded status
- **Generic Webhooks** - Custom HTTP endpoints with retry
- **Notification Queue** - BullMQ with 3-retry exponential backoff
- **Notification Worker** - 5 concurrent jobs
- **Templates** - DOWN, UP, DEGRADED, ACKNOWLEDGED notifications
- **Maintenance Window Suppression** - Skip alerts during maintenance

### Phase 5: Reports & Analytics ✅
- **Scheduled Reports** - Daily, weekly, monthly automation
- **Report Scheduler** - Cron-based hourly processing
- **CSV Export** - Full data exports (working)
- **PDF Generation** - Professional reports with charts (requires pdfkit)
- **Excel Export** - Multi-sheet workbooks (requires exceljs)
- **Email Delivery** - Automatic report distribution
- **Report Worker** - Background generation (2 concurrent)
- **Data Aggregation** - Executive summaries, project stats, uptime calculations

### Phase 6: Enterprise Features ✅
- **Maintenance Windows** - Suppress alerts during planned maintenance
  - One-time and recurring windows
  - Cron pattern support
  - Automatic expiration cleanup
- **Bulk Operations**:
  - CSV import/export monitors
  - Bulk status updates (pause/resume)
  - Bulk tag management
  - Bulk delete
- **Data Retention** - Automated cleanup worker (daily 2 AM):
  - Check results: 7 days
  - Notification logs: 30 days
  - Activity logs: 90 days
  - Generated reports: 30 days
- **Performance Optimization** - 30+ database indexes:
  - Composite indexes for common queries
  - GIN indexes for array searches (tags, monitor_ids)
  - Time-based indexes for historical queries
  - Partial indexes for active records
- **RBAC** - Admin and User roles enforced

### Phase 7: AWS Deployment (Coming Soon)
- ECS Fargate deployment
- RDS PostgreSQL
- ElastiCache Redis
- Application Load Balancer
- CloudWatch monitoring
- Terraform infrastructure

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       PULSE Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐         ┌────────────────────┐      │
│  │   React Frontend   │ ◄─────► │    Express API     │      │
│  │   (Port 3000)      │         │    (Port 3001)     │      │
│  └────────────────────┘         └────────────────────┘      │
│                                           │                  │
│                                           ▼                  │
│  ┌─────────────────────────────────────────────────┐        │
│  │            Orchestration Layer                   │        │
│  │  ┌─────────────┐  ┌─────────────┐              │        │
│  │  │  Scheduler  │  │  BullMQ     │              │        │
│  │  │  (Cron)     │  │  Queues     │              │        │
│  │  └─────────────┘  └─────────────┘              │        │
│  └─────────────────────────────────────────────────┘        │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────┐        │
│  │              Execution Layer                     │        │
│  │  ┌─────────────┐  ┌─────────────┐              │        │
│  │  │ HTTP Checker│  │  Workers    │              │        │
│  │  │   + RCA     │  │  (10 conc)  │              │        │
│  │  └─────────────┘  └─────────────┘              │        │
│  └─────────────────────────────────────────────────┘        │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────┐             │
│  │         Data Layer                          │             │
│  │  ┌──────────────┐    ┌──────────────┐     │             │
│  │  │  PostgreSQL  │    │    Redis     │     │             │
│  │  └──────────────┘    └──────────────┘     │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
pulse/
├── apps/
│   ├── api/                 # Backend Express API
│   │   ├── src/
│   │   │   ├── director/    # Business logic layer
│   │   │   ├── orchestration/ # Scheduling & queues
│   │   │   ├── execution/   # Workers & checkers
│   │   │   ├── auth/        # Authentication
│   │   │   └── ...
│   │   └── prisma/          # Database schema
│   │
│   └── web/                 # Frontend React app
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── pages/       # Page components
│       │   ├── lib/         # Utilities
│       │   ├── stores/      # State management
│       │   └── ...
│       └── ...
│
├── packages/
│   └── shared/              # Shared types & constants
│
├── scripts/                 # Database seeds, etc.
├── docs/                    # Documentation
└── docker-compose.yml       # Local infrastructure
```

## 🧪 What's Running

### Backend (Port 3001)
- **Express API Server** - REST endpoints + WebSocket ready
- **Schedulers**:
  - Check Scheduler (every minute)
  - Report Scheduler (hourly)
  - Cleanup Worker (daily at 2 AM)
- **Workers** (BullMQ):
  - Check Worker (10 concurrent jobs)
  - Notification Worker (5 concurrent jobs)
  - Report Worker (2 concurrent jobs)
- **Detectors**:
  - Incident Detector (3-failure rule)
  - Maintenance Window Checker

**Logs:**
```bash
# All logs
tail -f apps/api/logs/all.log

# Check activity
tail -f apps/api/logs/all.log | grep "Check"

# Notification activity
tail -f apps/api/logs/all.log | grep "Notification"

# Report generation
tail -f apps/api/logs/all.log | grep "Report"
```

### Frontend (Port 3000)
- Vite dev server with HMR
- React 18 with TypeScript
- Proxy to backend API

**Access:**
```bash
open http://localhost:3000
```

### Database
- PostgreSQL 16 on port 5432
- 10 seeded monitors
- 3 projects
- 3 users

**Studio:**
```bash
npm run db:studio
```

### Redis
- Redis 7 on port 6379
- BullMQ job queues
- Redis Commander on port 8081

## 📊 Monitoring in Action

### Automatic Checks
Every minute, the scheduler:
1. Fetches all active monitors
2. Filters by interval (60s, 300s, etc.)
3. Dispatches check jobs to BullMQ
4. Worker processes checks (10 concurrent)
5. Captures full RCA (DNS → TCP → TLS → HTTP)
6. Stores results in database
7. Updates monitor status
8. Detects incidents (3 failures)
9. Auto-resolves on recovery

### Check Logs
```bash
# Watch checks in real-time
tail -f apps/api/logs/all.log | grep "Check"

# You'll see:
# "📋 Scheduled 10 checks"
# "Monitor xxx: UP (245ms)"
# "Monitor xxx: DOWN - DNS_FAILURE"
# "🚨 Incident created for monitor xxx"
# "✅ Incident resolved for monitor xxx"
```

### API Examples

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulse.local","password":"password"}' | jq -r '.data.token')

# Get all monitors
curl -s "http://localhost:3001/api/v1/monitors" \
  -H "Authorization: Bearer $TOKEN" | jq

# Get open incidents
curl -s "http://localhost:3001/api/v1/incidents?status=OPEN" \
  -H "Authorization: Bearer $TOKEN" | jq

# Get dashboard summary
curl -s "http://localhost:3001/api/v1/dashboard/summary" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 📚 Documentation

Detailed documentation for each phase:

- [CLAUDE.md](CLAUDE.md) - Complete development guide
- [Phase 1 Complete](docs/PHASE-1-COMPLETE.md) - API foundation
- [Phase 2 Complete](docs/PHASE-2-COMPLETE.md) - Check engine & RCA
- [Phase 3 Complete](docs/PHASE-3-COMPLETE.md) - Dashboard & UI

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev:api          # Start backend API
npm run dev:web          # Start frontend

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database

# Build
npm run build:api        # Build backend
npm run build:web        # Build frontend

# Docker
npm run docker:up        # Start PostgreSQL + Redis
npm run docker:down      # Stop containers
npm run docker:logs      # View logs

# Code Quality
npm run lint             # Lint code
npm run format           # Format code
```

### Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 20 |
| **Language** | TypeScript 5 |
| **Backend** | Express.js |
| **Frontend** | React 18 + Vite |
| **Database** | PostgreSQL 16 |
| **Cache/Queue** | Redis 7 |
| **Job Queue** | BullMQ |
| **ORM** | Prisma |
| **Styling** | TailwindCSS |
| **Components** | shadcn/ui |
| **State** | Zustand |
| **Validation** | Zod |
| **Auth** | JWT |

## 🎯 Roadmap

- [x] Phase 1: Core Foundation (API, Auth, CRUD)
- [x] Phase 2: Check Engine & RCA
- [x] Phase 3: Dashboard & UI
- [x] Phase 4: Alerting & Notifications
- [x] Phase 5: Reports & Analytics
- [x] Phase 6: Enterprise Features
- [ ] Phase 7: AWS Deployment (ready when needed)

## 🤝 Contributing

This is a learning project built with Claude Code. Feel free to fork and experiment!

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

**Made with ❤️ and Claude Code**

For detailed implementation guides, see [CLAUDE.md](CLAUDE.md)
