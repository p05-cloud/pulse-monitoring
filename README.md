# PULSE - Reliability Monitoring Platform

> Enterprise-grade uptime monitoring platform with real-time alerts, detailed root cause analysis, and comprehensive reporting.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-success)](https://pulse-api-q7cs.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 Live Deployment

**Production API**: [https://pulse-api-q7cs.onrender.com](https://pulse-api-q7cs.onrender.com)

The API is deployed on Render.com with:
- PostgreSQL database
- Redis cache & queue
- Automatic health checks
- Auto-deploy from GitHub

## ✨ Features

### Core Capabilities
- **URL Monitoring** - HTTP/HTTPS endpoint monitoring with 1-minute intervals
- **Root Cause Analysis** - Detailed breakdown of failures (DNS, TCP, SSL, HTTP)
- **Smart Incident Detection** - 3 consecutive failures trigger incidents, auto-resolve on recovery
- **Multi-Channel Alerts** - Email (Resend), Microsoft Teams, and generic webhooks
- **Scheduled Reports** - Daily, weekly, monthly reports in PDF, Excel, or CSV
- **Enterprise Features** - Maintenance windows, bulk operations, data retention

### Monitoring Engine
- Full request lifecycle tracking (DNS → TCP → TLS → HTTP)
- 18 error categories for precise diagnostics
- Response time measurement
- Keyword validation
- SSL certificate expiration checks

### Alerting
- Professional HTML email templates
- Microsoft Teams adaptive cards
- Retry logic with exponential backoff
- Maintenance window suppression

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         PULSE Platform                   │
├─────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐   │
│  │  Express API │◄──►│  PostgreSQL  │   │
│  │  (Node.js)   │    │   Database   │   │
│  └──────────────┘    └──────────────┘   │
│         │                                │
│         ▼                                │
│  ┌──────────────┐    ┌──────────────┐   │
│  │   BullMQ     │◄──►│    Redis     │   │
│  │   Workers    │    │ Cache/Queue  │   │
│  └──────────────┘    └──────────────┘   │
│         │                                │
│         ▼                                │
│  ┌──────────────────────────────┐       │
│  │  Execution Layer             │       │
│  │  • HTTP Checker (10 workers) │       │
│  │  • Notification Sender        │       │
│  │  • Report Generator           │       │
│  │  • Cleanup Worker             │       │
│  └──────────────────────────────┘       │
└─────────────────────────────────────────┘
```

## 📡 API Reference

**Base URL**: `https://pulse-api-q7cs.onrender.com/api/v1`

### Authentication
All endpoints require JWT Bearer token (except `/auth/*` and `/health`):
```bash
# Login
curl -X POST https://pulse-api-q7cs.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulse.local","password":"password"}'

# Use returned token
curl https://pulse-api-q7cs.onrender.com/api/v1/monitors \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/auth/login` | POST | Login and get JWT |
| `/api/v1/monitors` | GET | List all monitors |
| `/api/v1/monitors` | POST | Create monitor |
| `/api/v1/incidents` | GET | List incidents |
| `/api/v1/dashboard/summary` | GET | Dashboard data |
| `/api/v1/projects` | GET | List projects |
| `/api/v1/alert-contacts` | GET | List alert contacts |

For complete API documentation, see [docs/API-TESTING.md](docs/API-TESTING.md)

## 🛠️ Technology Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 20 |
| **Language** | TypeScript 5 |
| **Framework** | Express.js |
| **Database** | PostgreSQL 16 |
| **Cache/Queue** | Redis 7 |
| **Job Processing** | BullMQ |
| **ORM** | Prisma |
| **Validation** | Zod |
| **Authentication** | JWT |
| **Email** | Resend API |

## 📁 Project Structure

```
pulse/
├── apps/
│   └── api/                    # Backend API
│       ├── src/
│       │   ├── director/       # Business logic
│       │   ├── orchestration/  # Schedulers & queues
│       │   ├── execution/      # Workers & checkers
│       │   ├── auth/           # Authentication
│       │   └── middleware/     # Express middleware
│       ├── prisma/             # Database schema
│       └── Dockerfile          # Production build
│
├── packages/
│   └── shared/                 # Shared types & constants
│
├── CLAUDE.md                   # Development guide
└── README.md                   # This file
```

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm 10+

### Setup

```bash
# Clone repository
git clone https://github.com/p05-cloud/pulse-monitoring.git
cd pulse-monitoring

# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Install dependencies
npm install

# Setup database
cd apps/api
npx prisma generate
npx prisma migrate deploy
npx tsx scripts/seed.ts

# Configure environment
cp ../../.env.example .env
# Edit .env and add your RESEND_API_KEY

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev              # Start API dev server

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data
npm run db:studio        # Open Prisma Studio

# Build
npm run build            # Build for production

# Docker
docker-compose up -d     # Start PostgreSQL + Redis
docker-compose down      # Stop containers
```

## 🔧 Environment Variables

Required environment variables (configured in Render.com):

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=re_...

# Server
PORT=3001
NODE_ENV=production
```

## 📊 Deployment

The application is deployed on Render.com with automatic deployments from the `main` branch.

**Deployment Configuration:**
- Docker-based build using multi-stage Dockerfile
- Automatic database migrations on deploy
- Health checks configured
- Auto-scaling enabled

**To deploy changes:**
```bash
git add .
git commit -m "Your changes"
git push origin main
# Render automatically deploys
```

## 🧪 Testing the API

```bash
# Health check
curl https://pulse-api-q7cs.onrender.com/health

# API info
curl https://pulse-api-q7cs.onrender.com/

# Login and get token
TOKEN=$(curl -s -X POST https://pulse-api-q7cs.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulse.local","password":"password"}' | jq -r '.data.token')

# Get monitors
curl -s https://pulse-api-q7cs.onrender.com/api/v1/monitors \
  -H "Authorization: Bearer $TOKEN" | jq

# Dashboard summary
curl -s https://pulse-api-q7cs.onrender.com/api/v1/dashboard/summary \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Complete development guide and architecture
- **[docs/API-TESTING.md](docs/API-TESTING.md)** - API testing guide

## 🤝 Contributing

This project was built with Claude Code as a learning exercise. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Deployed on [Render](https://render.com)
- Email by [Resend](https://resend.com)

---

**Made with ❤️ and Claude Code**

For detailed implementation guide and architectural decisions, see [CLAUDE.md](CLAUDE.md)
