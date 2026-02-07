# PULSE - Reliability Monitoring Platform

## 🎯 PROJECT OVERVIEW

**Pulse** is an enterprise-grade uptime monitoring platform built to replace UptimeRobot for internal monitoring teams. It provides real-time URL monitoring, detailed root cause analysis, intelligent alerting, and comprehensive reporting.

### Vision
> From Uptime Monitoring → **Reliability Intelligence Platform**

### Core Philosophy
- **Director → Orchestration → Execution** (DOE) architecture
- Simple, maintainable code over complex abstractions
- Local-first development, cloud-ready deployment
- Mobile-responsive from day one

---

## 📋 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Specification](#api-specification)
7. [Implementation Phases](#implementation-phases)
8. [Phase 1: Core Foundation](#phase-1-core-foundation)
9. [Phase 2: Check Engine & RCA](#phase-2-check-engine--rca)
10. [Phase 3: Dashboard & UI](#phase-3-dashboard--ui)
11. [Phase 4: Alerting & Notifications](#phase-4-alerting--notifications)
12. [Phase 5: Reports & Analytics](#phase-5-reports--analytics)
13. [Phase 6: Enterprise Features](#phase-6-enterprise-features)
14. [Phase 7: AWS Deployment](#phase-7-aws-deployment)
15. [Testing Strategy](#testing-strategy)
16. [Development Guidelines](#development-guidelines)
17. [Troubleshooting](#troubleshooting)

---

## 🚀 QUICK START

### Prerequisites
- Node.js 20+ 
- Docker & Docker Compose
- Git
- VS Code with Claude Code extension (recommended)

### Initial Setup

```bash
# Clone/Create project
mkdir pulse && cd pulse

# Initialize monorepo
npm init -y
npm install -D typescript @types/node tsx

# Start infrastructure
docker-compose up -d

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development
npm run dev
```

### Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: pulse-postgres
    environment:
      POSTGRES_USER: pulse
      POSTGRES_PASSWORD: pulse_dev_password
      POSTGRES_DB: pulse
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pulse"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: pulse-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Optional: Redis UI for debugging
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: pulse-redis-ui
    environment:
      REDIS_HOSTS: local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis

volumes:
  postgres_data:
  redis_data:
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### DOE Model: Director → Orchestration → Execution

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              PULSE                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      DIRECTOR LAYER                              │   │
│  │                   (Decisions & Rules)                            │   │
│  │                                                                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │   │
│  │  │  Monitor    │ │  Incident   │ │   Alert     │ │  Report    │ │   │
│  │  │  Registry   │ │  Detector   │ │   Rules     │ │  Config    │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   ORCHESTRATION LAYER                            │   │
│  │                  (Workflows & Queues)                            │   │
│  │                                                                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │   │
│  │  │   Check     │ │  Incident   │ │Notification │ │  Report    │ │   │
│  │  │  Scheduler  │ │  Workflow   │ │   Queue     │ │  Queue     │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │   │
│  │                                                                   │   │
│  │                    ┌─────────────────┐                           │   │
│  │                    │   Redis/BullMQ  │                           │   │
│  │                    │   Message Bus   │                           │   │
│  │                    └─────────────────┘                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    EXECUTION LAYER                               │   │
│  │                   (Workers & Actions)                            │   │
│  │                                                                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │   │
│  │  │    HTTP     │ │   Alert     │ │   Report    │ │  Cleanup   │ │   │
│  │  │   Checker   │ │   Sender    │ │   Builder   │ │  Worker    │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      DATA LAYER                                  │   │
│  │                                                                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │   │
│  │  │ PostgreSQL  │ │    Redis    │ │   File      │                │   │
│  │  │  (Primary)  │ │(Cache/Queue)│ │  Storage    │                │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   PRESENTATION LAYER                             │   │
│  │                                                                   │   │
│  │  ┌────────────────────┐    ┌────────────────────┐               │   │
│  │  │   React Dashboard  │    │     REST API       │               │   │
│  │  │  (Desktop+Mobile)  │    │   + WebSocket      │               │   │
│  │  └────────────────────┘    └────────────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| **Director** | Monitor Registry | Store URL configs, tags, intervals |
| **Director** | Incident Detector | Decide when failures = incident (3 consecutive) |
| **Director** | Alert Rules | Who gets notified, when, how |
| **Director** | Report Config | Report schedules, recipients, formats |
| **Orchestration** | Check Scheduler | Dispatch checks every minute via cron |
| **Orchestration** | Incident Workflow | Manage state: OPEN → ACK → RESOLVED |
| **Orchestration** | Notification Queue | Queue alerts with retry logic |
| **Orchestration** | Report Queue | Async report generation |
| **Execution** | HTTP Checker | Execute checks, capture detailed RCA |
| **Execution** | Alert Sender | Send email, Teams, webhooks |
| **Execution** | Report Builder | Generate PDF, CSV, Excel |
| **Execution** | Cleanup Worker | Purge old data (7-day retention) |

---

## 🛠️ TECH STACK

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | 20 LTS | Server-side JavaScript |
| **Language** | TypeScript | 5.x | Type safety |
| **API Framework** | Express.js | 4.x | REST API |
| **Database** | PostgreSQL | 16 | Primary data store |
| **Cache/Queue** | Redis | 7 | Caching, job queues |
| **Job Queue** | BullMQ | 5.x | Background job processing |
| **ORM** | Prisma | 5.x | Database access |
| **Frontend** | React | 18 | Dashboard UI |
| **UI Components** | shadcn/ui | latest | Pre-built components |
| **Styling** | TailwindCSS | 3.x | Utility-first CSS |
| **Charts** | Recharts | 2.x | Data visualization |
| **Real-time** | Socket.io | 4.x | WebSocket communication |
| **HTTP Client** | Axios | 1.x | HTTP requests |
| **Email** | Nodemailer | 6.x | Email sending |
| **PDF Generation** | PDFKit | 0.14 | Report PDFs |
| **Excel Generation** | ExcelJS | 4.x | Excel exports |
| **Validation** | Zod | 3.x | Schema validation |
| **Auth** | JWT | - | Authentication |

### Development Tools

| Tool | Purpose |
|------|---------|
| Docker Compose | Local infrastructure |
| ESLint | Code linting |
| Prettier | Code formatting |
| Vitest | Unit testing |
| Playwright | E2E testing |

### AWS Services (Production)

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| ECS Fargate | Container hosting | ~$30-50/month |
| RDS PostgreSQL | Database | ~$15-30/month |
| ElastiCache Redis | Cache/Queue | ~$15-25/month |
| SES | Email sending | ~$0.10/1000 emails |
| S3 | Report storage | ~$1-5/month |
| CloudWatch | Logging/Monitoring | ~$5-10/month |
| ALB | Load balancer | ~$20/month |
| **Total Estimate** | | **~$90-150/month** |

---

## 📁 PROJECT STRUCTURE

```
pulse/
├── CLAUDE.md                    # This file - development guide
├── README.md                    # Project readme
├── package.json                 # Root package.json (workspace)
├── docker-compose.yml           # Local development infrastructure
├── .env.example                 # Environment variables template
├── .gitignore
├── tsconfig.base.json           # Shared TypeScript config
│
├── apps/
│   ├── api/                     # Backend API service
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point
│   │   │   ├── app.ts           # Express app setup
│   │   │   ├── config/
│   │   │   │   ├── index.ts     # Configuration loader
│   │   │   │   ├── database.ts  # Database connection
│   │   │   │   └── redis.ts     # Redis connection
│   │   │   │
│   │   │   ├── director/        # DIRECTOR LAYER
│   │   │   │   ├── monitors/
│   │   │   │   │   ├── monitor.service.ts
│   │   │   │   │   ├── monitor.controller.ts
│   │   │   │   │   └── monitor.routes.ts
│   │   │   │   ├── incidents/
│   │   │   │   │   ├── incident.service.ts
│   │   │   │   │   ├── incident.detector.ts
│   │   │   │   │   ├── incident.controller.ts
│   │   │   │   │   └── incident.routes.ts
│   │   │   │   ├── alerts/
│   │   │   │   │   ├── alert.service.ts
│   │   │   │   │   └── alert.routes.ts
│   │   │   │   └── reports/
│   │   │   │       ├── report.config.ts
│   │   │   │       └── report.routes.ts
│   │   │   │
│   │   │   ├── orchestration/   # ORCHESTRATION LAYER
│   │   │   │   ├── scheduler/
│   │   │   │   │   ├── check.scheduler.ts
│   │   │   │   │   └── report.scheduler.ts
│   │   │   │   ├── queues/
│   │   │   │   │   ├── queue.config.ts
│   │   │   │   │   ├── check.queue.ts
│   │   │   │   │   ├── notification.queue.ts
│   │   │   │   │   └── report.queue.ts
│   │   │   │   └── workflows/
│   │   │   │       └── incident.workflow.ts
│   │   │   │
│   │   │   ├── execution/       # EXECUTION LAYER
│   │   │   │   ├── checker/
│   │   │   │   │   ├── http.checker.ts
│   │   │   │   │   ├── dns.resolver.ts
│   │   │   │   │   ├── tls.inspector.ts
│   │   │   │   │   └── rca.builder.ts
│   │   │   │   ├── notifiers/
│   │   │   │   │   ├── email.notifier.ts
│   │   │   │   │   ├── teams.notifier.ts
│   │   │   │   │   └── webhook.notifier.ts
│   │   │   │   ├── reporters/
│   │   │   │   │   ├── pdf.builder.ts
│   │   │   │   │   ├── excel.builder.ts
│   │   │   │   │   └── csv.builder.ts
│   │   │   │   └── workers/
│   │   │   │       ├── check.worker.ts
│   │   │   │       ├── notification.worker.ts
│   │   │   │       ├── report.worker.ts
│   │   │   │       └── cleanup.worker.ts
│   │   │   │
│   │   │   ├── auth/            # Authentication
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   └── auth.routes.ts
│   │   │   │
│   │   │   ├── users/           # User management
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   └── user.routes.ts
│   │   │   │
│   │   │   ├── projects/        # Project management
│   │   │   │   ├── project.service.ts
│   │   │   │   ├── project.controller.ts
│   │   │   │   └── project.routes.ts
│   │   │   │
│   │   │   ├── dashboard/       # Dashboard data
│   │   │   │   ├── dashboard.service.ts
│   │   │   │   ├── dashboard.controller.ts
│   │   │   │   └── dashboard.routes.ts
│   │   │   │
│   │   │   ├── websocket/       # Real-time updates
│   │   │   │   ├── socket.handler.ts
│   │   │   │   └── events.ts
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── error.handler.ts
│   │   │   │   ├── request.logger.ts
│   │   │   │   └── rate.limiter.ts
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── logger.ts
│   │   │       ├── errors.ts
│   │   │       └── helpers.ts
│   │   │
│   │   └── prisma/
│   │       ├── schema.prisma    # Database schema
│   │       └── migrations/      # Database migrations
│   │
│   └── web/                     # Frontend application
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── index.html
│       ├── public/
│       │   └── favicon.ico
│       └── src/
│           ├── main.tsx         # Entry point
│           ├── App.tsx          # Root component
│           ├── index.css        # Global styles
│           │
│           ├── components/      # Reusable components
│           │   ├── ui/          # shadcn/ui components
│           │   ├── layout/
│           │   │   ├── Header.tsx
│           │   │   ├── Sidebar.tsx
│           │   │   └── Layout.tsx
│           │   ├── monitors/
│           │   │   ├── MonitorCard.tsx
│           │   │   ├── MonitorList.tsx
│           │   │   ├── MonitorForm.tsx
│           │   │   └── MonitorStatus.tsx
│           │   ├── incidents/
│           │   │   ├── IncidentCard.tsx
│           │   │   ├── IncidentTimeline.tsx
│           │   │   └── RCADetails.tsx
│           │   ├── dashboard/
│           │   │   ├── HealthSummary.tsx
│           │   │   ├── ProjectHealth.tsx
│           │   │   ├── UptimeChart.tsx
│           │   │   └── ActivityLog.tsx
│           │   └── reports/
│           │       ├── ReportConfig.tsx
│           │       └── ReportViewer.tsx
│           │
│           ├── pages/           # Page components
│           │   ├── Dashboard.tsx
│           │   ├── Monitors.tsx
│           │   ├── MonitorDetail.tsx
│           │   ├── Incidents.tsx
│           │   ├── IncidentDetail.tsx
│           │   ├── Projects.tsx
│           │   ├── Reports.tsx
│           │   ├── Settings.tsx
│           │   ├── Users.tsx
│           │   ├── Login.tsx
│           │   └── NotFound.tsx
│           │
│           ├── hooks/           # Custom React hooks
│           │   ├── useMonitors.ts
│           │   ├── useIncidents.ts
│           │   ├── useWebSocket.ts
│           │   ├── useAuth.ts
│           │   └── useDashboard.ts
│           │
│           ├── services/        # API client
│           │   ├── api.ts
│           │   ├── monitors.api.ts
│           │   ├── incidents.api.ts
│           │   ├── projects.api.ts
│           │   ├── reports.api.ts
│           │   └── auth.api.ts
│           │
│           ├── stores/          # State management
│           │   ├── auth.store.ts
│           │   ├── monitors.store.ts
│           │   └── ui.store.ts
│           │
│           ├── types/           # TypeScript types
│           │   ├── monitor.types.ts
│           │   ├── incident.types.ts
│           │   ├── user.types.ts
│           │   └── api.types.ts
│           │
│           └── utils/
│               ├── formatters.ts
│               ├── validators.ts
│               └── constants.ts
│
├── packages/
│   └── shared/                  # Shared code
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/           # Shared TypeScript types
│           │   ├── monitor.ts
│           │   ├── incident.ts
│           │   ├── rca.ts
│           │   └── index.ts
│           ├── constants/
│           │   ├── status.ts
│           │   ├── errors.ts
│           │   └── index.ts
│           └── utils/
│               ├── date.ts
│               └── index.ts
│
├── scripts/
│   ├── seed.ts                  # Database seeding
│   ├── migrate.ts               # Migration runner
│   └── generate-types.ts        # Type generation
│
├── terraform/                   # AWS Infrastructure
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── ecs/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   ├── alb/
│   │   └── networking/
│   └── environments/
│       ├── dev/
│       └── prod/
│
└── docs/
    ├── api.md                   # API documentation
    ├── deployment.md            # Deployment guide
    └── architecture.md          # Architecture details
```

---

## 🗄️ DATABASE SCHEMA

### Prisma Schema

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER & AUTH
// ============================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String?
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  activityLogs  ActivityLog[]
  projectUsers  ProjectUser[]

  @@map("users")
}

enum UserRole {
  ADMIN
  USER
}

// ============================================
// PROJECTS & ORGANIZATION
// ============================================

model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  color       String   @default("#3B82F6") // For UI badges
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  monitors     Monitor[]
  projectUsers ProjectUser[]

  @@map("projects")
}

model ProjectUser {
  projectId String  @map("project_id")
  userId    String  @map("user_id")
  role      String  @default("member") // owner, member

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([projectId, userId])
  @@map("project_users")
}

// ============================================
// MONITORS
// ============================================

model Monitor {
  id                  String        @id @default(uuid())
  projectId           String        @map("project_id")
  name                String
  url                 String
  method              HttpMethod    @default(GET)
  intervalSeconds     Int           @default(60) @map("interval_seconds")
  timeoutMs           Int           @default(30000) @map("timeout_ms")
  expectedStatus      Int           @default(200) @map("expected_status")
  keyword             String?
  headers             Json          @default("{}")
  tags                String[]      @default([])
  
  // Status
  isActive            Boolean       @default(true) @map("is_active")
  currentStatus       MonitorStatus @default(UNKNOWN) @map("current_status")
  lastCheckAt         DateTime?     @map("last_check_at")
  lastStatusChangeAt  DateTime?     @map("last_status_change_at")
  consecutiveFailures Int           @default(0) @map("consecutive_failures")
  
  // Metadata
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")

  // Relations
  project             Project               @relation(fields: [projectId], references: [id], onDelete: Cascade)
  checkResults        CheckResult[]
  incidents           Incident[]
  alertContacts       MonitorAlertContact[]

  @@index([projectId])
  @@index([currentStatus])
  @@index([tags])
  @@map("monitors")
}

enum HttpMethod {
  GET
  POST
  PUT
  PATCH
  DELETE
  HEAD
  OPTIONS
}

enum MonitorStatus {
  UP
  DOWN
  DEGRADED
  UNKNOWN
  PAUSED
}

// ============================================
// CHECK RESULTS
// ============================================

model CheckResult {
  id             String    @id @default(uuid())
  monitorId      String    @map("monitor_id")
  checkedAt      DateTime  @map("checked_at")
  success        Boolean
  responseTimeMs Int?      @map("response_time_ms")
  statusCode     Int?      @map("status_code")
  errorCategory  String?   @map("error_category")
  errorMessage   String?   @map("error_message")
  rcaDetails     Json?     @map("rca_details")
  createdAt      DateTime  @default(now()) @map("created_at")

  // Relations
  monitor Monitor @relation(fields: [monitorId], references: [id], onDelete: Cascade)

  @@index([monitorId, checkedAt(sort: Desc)])
  @@map("check_results")
}

// ============================================
// INCIDENTS
// ============================================

model Incident {
  id              String         @id @default(uuid())
  monitorId       String         @map("monitor_id")
  status          IncidentStatus @default(OPEN)
  startedAt       DateTime       @map("started_at")
  acknowledgedAt  DateTime?      @map("acknowledged_at")
  acknowledgedBy  String?        @map("acknowledged_by")
  resolvedAt      DateTime?      @map("resolved_at")
  durationSeconds Int?           @map("duration_seconds")
  errorCategory   String?        @map("error_category")
  errorMessage    String?        @map("error_message")
  rcaDetails      Json?          @map("rca_details")
  notes           String?
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  // Relations
  monitor           Monitor            @relation(fields: [monitorId], references: [id], onDelete: Cascade)
  notificationLogs  NotificationLog[]

  @@index([monitorId, status])
  @@index([startedAt(sort: Desc)])
  @@map("incidents")
}

enum IncidentStatus {
  OPEN
  ACKNOWLEDGED
  RESOLVED
}

// ============================================
// ALERT CONTACTS & NOTIFICATIONS
// ============================================

model AlertContact {
  id        String           @id @default(uuid())
  name      String
  type      AlertContactType
  config    Json             // { email: "...", webhookUrl: "...", teamsWebhook: "..." }
  isActive  Boolean          @default(true) @map("is_active")
  createdAt DateTime         @default(now()) @map("created_at")
  updatedAt DateTime         @updatedAt @map("updated_at")

  // Relations
  monitors         MonitorAlertContact[]
  notificationLogs NotificationLog[]

  @@map("alert_contacts")
}

enum AlertContactType {
  EMAIL
  TEAMS
  WEBHOOK
  SLACK
}

model MonitorAlertContact {
  monitorId      String @map("monitor_id")
  alertContactId String @map("alert_contact_id")

  monitor      Monitor      @relation(fields: [monitorId], references: [id], onDelete: Cascade)
  alertContact AlertContact @relation(fields: [alertContactId], references: [id], onDelete: Cascade)

  @@id([monitorId, alertContactId])
  @@map("monitor_alert_contacts")
}

model NotificationLog {
  id             String             @id @default(uuid())
  incidentId     String             @map("incident_id")
  alertContactId String             @map("alert_contact_id")
  type           NotificationType
  status         NotificationStatus @default(PENDING)
  sentAt         DateTime?          @map("sent_at")
  errorMessage   String?            @map("error_message")
  retryCount     Int                @default(0) @map("retry_count")
  createdAt      DateTime           @default(now()) @map("created_at")

  // Relations
  incident     Incident     @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  alertContact AlertContact @relation(fields: [alertContactId], references: [id], onDelete: Cascade)

  @@map("notification_logs")
}

enum NotificationType {
  DOWN
  UP
  DEGRADED
  ACKNOWLEDGED
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}

// ============================================
// REPORTS
// ============================================

model ReportSchedule {
  id          String          @id @default(uuid())
  name        String
  frequency   ReportFrequency
  projectIds  String[]        @map("project_ids")
  recipients  String[]        // Email addresses
  format      ReportFormat    @default(PDF)
  isActive    Boolean         @default(true) @map("is_active")
  lastRunAt   DateTime?       @map("last_run_at")
  nextRunAt   DateTime?       @map("next_run_at")
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")

  @@map("report_schedules")
}

enum ReportFrequency {
  DAILY
  WEEKLY
  MONTHLY
}

enum ReportFormat {
  PDF
  EXCEL
  CSV
}

model GeneratedReport {
  id          String       @id @default(uuid())
  scheduleId  String?      @map("schedule_id")
  name        String
  format      ReportFormat
  startDate   DateTime     @map("start_date")
  endDate     DateTime     @map("end_date")
  filePath    String?      @map("file_path")
  fileSize    Int?         @map("file_size")
  status      String       @default("PENDING") // PENDING, GENERATING, COMPLETED, FAILED
  createdAt   DateTime     @default(now()) @map("created_at")

  @@map("generated_reports")
}

// ============================================
// ACTIVITY LOGS
// ============================================

model ActivityLog {
  id         String   @id @default(uuid())
  userId     String?  @map("user_id")
  action     String
  entityType String?  @map("entity_type")
  entityId   String?  @map("entity_id")
  details    Json?
  ipAddress  String?  @map("ip_address")
  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([entityType, entityId])
  @@index([createdAt(sort: Desc)])
  @@map("activity_logs")
}

// ============================================
// MAINTENANCE WINDOWS (Enterprise Feature)
// ============================================

model MaintenanceWindow {
  id          String   @id @default(uuid())
  name        String
  monitorIds  String[] @map("monitor_ids")
  startTime   DateTime @map("start_time")
  endTime     DateTime @map("end_time")
  recurring   Boolean  @default(false)
  cronPattern String?  @map("cron_pattern")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("maintenance_windows")
}
```

---

## 📡 API SPECIFICATION

### Base URL
- Local: `http://localhost:3001/api/v1`
- Production: `https://pulse.yourdomain.com/api/v1`

### Authentication
All endpoints (except `/auth/*`) require JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

### API Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/logout` | Logout, invalidate token |
| POST | `/auth/refresh` | Refresh JWT token |
| GET | `/auth/me` | Get current user |

#### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Get project details |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |
| GET | `/projects/:id/health` | Get project health summary |

#### Monitors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/monitors` | List monitors (supports filtering) |
| POST | `/monitors` | Create monitor |
| GET | `/monitors/:id` | Get monitor details |
| PUT | `/monitors/:id` | Update monitor |
| DELETE | `/monitors/:id` | Delete monitor |
| POST | `/monitors/:id/pause` | Pause monitor |
| POST | `/monitors/:id/resume` | Resume monitor |
| GET | `/monitors/:id/checks` | Get check history |
| GET | `/monitors/:id/incidents` | Get incident history |
| POST | `/monitors/bulk` | Bulk create monitors |
| POST | `/monitors/import` | Import from CSV |

#### Incidents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/incidents` | List incidents (supports filtering) |
| GET | `/incidents/:id` | Get incident details with RCA |
| POST | `/incidents/:id/acknowledge` | Acknowledge incident |
| POST | `/incidents/:id/resolve` | Manually resolve incident |
| PUT | `/incidents/:id/notes` | Update incident notes |

#### Alert Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alert-contacts` | List alert contacts |
| POST | `/alert-contacts` | Create alert contact |
| PUT | `/alert-contacts/:id` | Update alert contact |
| DELETE | `/alert-contacts/:id` | Delete alert contact |
| POST | `/alert-contacts/:id/test` | Send test notification |

#### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Overall health summary |
| GET | `/dashboard/projects` | Project-wise health |
| GET | `/dashboard/activity` | Recent activity log |
| GET | `/dashboard/timeline` | Incident timeline |

#### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/schedules` | List report schedules |
| POST | `/reports/schedules` | Create report schedule |
| PUT | `/reports/schedules/:id` | Update report schedule |
| DELETE | `/reports/schedules/:id` | Delete report schedule |
| POST | `/reports/generate` | Generate on-demand report |
| GET | `/reports/:id/download` | Download generated report |

#### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users |
| POST | `/users` | Create user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

### Query Parameters

**Filtering monitors:**
```
GET /monitors?projectId=xxx&status=DOWN&tags=production,critical
```

**Pagination:**
```
GET /monitors?page=1&limit=20
```

**Date range:**
```
GET /incidents?startDate=2024-01-01&endDate=2024-01-31
```

### WebSocket Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `monitor:status` | Server→Client | `{ monitorId, status, timestamp }` | Status change |
| `incident:created` | Server→Client | `{ incident }` | New incident |
| `incident:resolved` | Server→Client | `{ incident }` | Incident resolved |
| `check:completed` | Server→Client | `{ monitorId, result }` | Check completed |

---

## 📅 IMPLEMENTATION PHASES

### Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION TIMELINE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Week 1-2: Phase 1 - Core Foundation                                │
│  ══════════════════════════════════                                 │
│  [████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░]  │
│                                                                      │
│  Week 3-4: Phase 2 - Check Engine & RCA                             │
│  ═══════════════════════════════════════                            │
│  [░░░░░░░░░░░░░░░░████████████████████████████████░░░░░░░░░░░░░░]  │
│                                                                      │
│  Week 5-6: Phase 3 - Dashboard & UI                                 │
│  ══════════════════════════════════                                 │
│  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████████████████░░░░░░]  │
│                                                                      │
│  Week 7-8: Phase 4 - Alerting & Notifications                       │
│  ═════════════════════════════════════════════                      │
│  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████]  │
│                                                                      │
│  Week 9-10: Phase 5 - Reports & Analytics                           │
│  ════════════════════════════════════════                           │
│                                                                      │
│  Week 11-12: Phase 6 - Enterprise Features                          │
│  ══════════════════════════════════════════                         │
│                                                                      │
│  Week 13-14: Phase 7 - AWS Deployment                               │
│  ════════════════════════════════════                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔨 PHASE 1: CORE FOUNDATION

**Duration:** Week 1-2
**Goal:** Basic project structure, database, authentication, and CRUD APIs

### Tasks

#### 1.1 Project Setup
```
□ Initialize monorepo with npm workspaces
□ Set up TypeScript configuration
□ Create docker-compose.yml for Postgres + Redis
□ Set up ESLint and Prettier
□ Create environment configuration
□ Set up Prisma with initial schema
```

#### 1.2 Database Setup
```
□ Create Prisma schema (all tables)
□ Generate initial migration
□ Create seed script with sample data
□ Verify database connectivity
```

#### 1.3 API Foundation
```
□ Set up Express app with middleware
□ Implement error handling
□ Set up request logging
□ Create health check endpoint
```

#### 1.4 Authentication
```
□ Implement JWT authentication
□ Create login/logout endpoints
□ Implement auth middleware
□ Create password hashing utilities
```

#### 1.5 Basic CRUD APIs
```
□ Projects CRUD endpoints
□ Monitors CRUD endpoints  
□ Users CRUD endpoints (admin)
□ Alert Contacts CRUD endpoints
```

### Deliverables
- Working API with basic CRUD operations
- Docker Compose development environment
- Database schema and migrations
- Authentication system

### Commands to Run
```bash
# Start phase 1 development
cd pulse
docker-compose up -d
npm run db:migrate
npm run db:seed
npm run dev:api
```

---

## 🔨 PHASE 2: CHECK ENGINE & RCA

**Duration:** Week 3-4
**Goal:** Implement HTTP checker with detailed RCA capture

### Tasks

#### 2.1 Queue Setup
```
□ Configure BullMQ with Redis
□ Create check queue
□ Create notification queue
□ Implement queue dashboard (optional: Bull Board)
```

#### 2.2 Check Scheduler
```
□ Implement cron-based scheduler
□ Fetch monitors due for checking
□ Dispatch check jobs to queue
□ Handle interval variations (1min, 5min, etc.)
```

#### 2.3 HTTP Checker Implementation
```
□ DNS resolution with timing
□ TCP connection with timing
□ TLS/SSL inspection
□ HTTP request execution
□ Keyword validation
□ Response time measurement
```

#### 2.4 RCA Builder
```
□ Categorize errors (DNS, SSL, HTTP, Timeout, etc.)
□ Capture timing breakdown
□ Store detailed RCA in JSON
□ Build human-readable error messages
```

#### 2.5 Check Worker
```
□ Process check jobs from queue
□ Execute checks
□ Store results in database
□ Update monitor status
□ Detect consecutive failures
```

#### 2.6 Incident Detection
```
□ Implement 3-consecutive-failure rule
□ Create incident on failure threshold
□ Auto-resolve incident on recovery
□ Calculate incident duration
```

### Key Code: RCA Categories

```typescript
// packages/shared/src/types/rca.ts

export enum RCACategory {
  DNS_FAILURE = 'DNS_FAILURE',
  DNS_TIMEOUT = 'DNS_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_RESET = 'CONNECTION_RESET',
  SSL_CERTIFICATE_EXPIRED = 'SSL_CERTIFICATE_EXPIRED',
  SSL_CERTIFICATE_INVALID = 'SSL_CERTIFICATE_INVALID',
  SSL_HOSTNAME_MISMATCH = 'SSL_HOSTNAME_MISMATCH',
  SSL_HANDSHAKE_FAILED = 'SSL_HANDSHAKE_FAILED',
  HTTP_4XX = 'HTTP_4XX',
  HTTP_5XX = 'HTTP_5XX',
  HTTP_UNEXPECTED_STATUS = 'HTTP_UNEXPECTED_STATUS',
  TIMEOUT = 'TIMEOUT',
  KEYWORD_MISSING = 'KEYWORD_MISSING',
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface RCADetails {
  category: RCACategory;
  message: string;
  timestamp: string;
  phases: {
    dns?: {
      durationMs: number;
      resolvedIp?: string;
      success: boolean;
      error?: string;
    };
    tcp?: {
      durationMs: number;
      success: boolean;
      error?: string;
    };
    tls?: {
      durationMs: number;
      protocol?: string;
      cipher?: string;
      certValid?: boolean;
      certExpires?: string;
      certIssuer?: string;
      success: boolean;
      error?: string;
    };
    http?: {
      durationMs: number;
      statusCode?: number;
      statusText?: string;
      contentType?: string;
      contentLength?: number;
      server?: string;
      responseBodyPreview?: string;
      success: boolean;
      error?: string;
    };
    keyword?: {
      expected: string;
      found: boolean;
      success: boolean;
    };
  };
  totalDurationMs: number;
}
```

### Deliverables
- Working check scheduler
- HTTP checker with full RCA capture
- Incident detection and auto-resolution
- Check history stored in database

---

## 🔨 PHASE 3: DASHBOARD & UI

**Duration:** Week 5-6
**Goal:** React dashboard with real-time updates

### Tasks

#### 3.1 Frontend Setup
```
□ Initialize React with Vite
□ Set up TailwindCSS
□ Install and configure shadcn/ui
□ Set up React Router
□ Configure API client (Axios)
```

#### 3.2 Layout Components
```
□ Header with navigation
□ Sidebar with menu
□ Responsive layout wrapper
□ Mobile navigation
```

#### 3.3 Authentication UI
```
□ Login page
□ Auth context/store
□ Protected routes
□ Token management
```

#### 3.4 Dashboard Page
```
□ Overall health summary card
□ Project-wise health cards
□ Monitor count: Up/Down/Total
□ Recent activity log
□ Quick stats
```

#### 3.5 Monitors Management
```
□ Monitor list with filtering
□ Monitor card component
□ Create/Edit monitor form
□ Monitor detail page
□ Check history chart
□ Tag/project filters
```

#### 3.6 Incidents View
```
□ Incident list with status filters
□ Incident detail with RCA
□ Timeline visualization
□ Acknowledge/Resolve actions
```

#### 3.7 Real-time Updates
```
□ Set up Socket.io client
□ Subscribe to status changes
□ Auto-update dashboard
□ Toast notifications
```

### UI Components Needed

```
Dashboard:
├── HealthSummaryCard       # Total Up/Down/Degraded
├── ProjectHealthGrid       # Cards per project
├── ActivityTimeline        # Recent events
├── QuickStats              # Response times, uptime %

Monitors:
├── MonitorListTable        # Sortable, filterable table
├── MonitorCard             # Card view option
├── MonitorStatusBadge      # UP/DOWN/DEGRADED badge
├── MonitorForm             # Create/Edit form
├── CheckHistoryChart       # Line chart of response times
├── UptimePercentage        # Visual uptime indicator

Incidents:
├── IncidentListTable       # List with status filter
├── IncidentCard            # Summary card
├── IncidentTimeline        # Visual timeline
├── RCADetailsPanel         # Expandable RCA breakdown
├── IncidentActions         # Acknowledge, Resolve buttons

Common:
├── FilterBar               # Tags, status, project filters
├── SearchInput             # Search monitors
├── DateRangePicker         # For reports, filtering
├── LoadingSpinner          # Loading states
├── EmptyState              # No data states
├── ConfirmDialog           # Delete confirmations
```

### Deliverables
- Responsive React dashboard
- Real-time status updates
- Monitor management CRUD
- Incident viewing with RCA

---

## 🔨 PHASE 4: ALERTING & NOTIFICATIONS

**Duration:** Week 7-8
**Goal:** Email and MS Teams notifications with templates

### Tasks

#### 4.1 Notification Queue
```
□ Configure notification queue
□ Implement retry logic (3 attempts)
□ Handle delivery failures
□ Log notification attempts
```

#### 4.2 Email Notifications
```
□ Configure Nodemailer
□ Create HTML email templates
□ Implement email notifier
□ Handle email delivery errors
```

#### 4.3 MS Teams Integration
```
□ Implement Teams webhook notifier
□ Create adaptive card templates
□ Handle webhook failures
```

#### 4.4 Webhook Notifications
```
□ Implement generic webhook notifier
□ Support custom headers
□ Retry with backoff
```

#### 4.5 Notification Worker
```
□ Process notification jobs
□ Route to correct notifier
□ Update notification log
□ Handle failures gracefully
```

#### 4.6 Alert Contact Management UI
```
□ List alert contacts
□ Create/edit forms
□ Test notification button
□ Associate with monitors
```

### Email Template Structure

```typescript
// DOWN notification email content:
Subject: 🔴 [PULSE] DOWN: {monitor.name}

Body:
- Monitor: {name}
- URL: {url}
- Status: DOWN
- Started: {timestamp}
- Error: {errorCategory} - {errorMessage}
- RCA Summary:
  - DNS: {dns.durationMs}ms
  - TCP: {tcp.durationMs}ms
  - TLS: {tls.durationMs}ms
  - HTTP: {http.statusCode}
- Project: {project.name}
- Tags: {tags}

[View Incident] button

// UP notification email content:
Subject: ✅ [PULSE] RECOVERED: {monitor.name}

Body:
- Monitor: {name}
- URL: {url}
- Status: UP
- Down Duration: {duration}
- Recovered: {timestamp}
- Project: {project.name}
```

### Deliverables
- Working email notifications
- MS Teams integration
- Webhook support
- Notification logging

---

## 🔨 PHASE 5: REPORTS & ANALYTICS

**Duration:** Week 9-10
**Goal:** Scheduled reports and export functionality

### Tasks

#### 5.1 Report Scheduler
```
□ Create report schedule model
□ Implement schedule checker (daily cron)
□ Queue report generation jobs
```

#### 5.2 Report Data Aggregation
```
□ Calculate uptime percentages
□ Aggregate incidents by monitor
□ Calculate response time stats
□ Generate project summaries
```

#### 5.3 PDF Report Builder
```
□ Set up PDFKit
□ Create report template
□ Generate charts as images
□ Build professional PDF layout
```

#### 5.4 Excel Report Builder
```
□ Set up ExcelJS
□ Create worksheets structure
□ Add formatting and styles
□ Generate charts in Excel
```

#### 5.5 CSV Export
```
□ Generate raw data CSV
□ Support various data exports
□ Handle large datasets
```

#### 5.6 Report Storage & Delivery
```
□ Store generated reports (local/S3)
□ Send reports via email
□ Provide download links
□ Cleanup old reports
```

#### 5.7 Reports UI
```
□ Report schedule management
□ On-demand report generation
□ Report history list
□ Download functionality
```

### Report Content

```
PULSE Uptime Report
Period: {startDate} - {endDate}

EXECUTIVE SUMMARY
-----------------
Total Monitors: XX
Overall Uptime: XX.XX%
Total Incidents: XX
Avg Response Time: XXXms

PROJECT SUMMARY
---------------
| Project | Monitors | Uptime % | Incidents |
|---------|----------|----------|-----------|
| Proj A  | 10       | 99.95%   | 2         |
| Proj B  | 15       | 99.80%   | 5         |

INCIDENT DETAILS
----------------
| Monitor | Start | End | Duration | RCA |
|---------|-------|-----|----------|-----|
| API-1   | ...   | ... | 5m 32s   | HTTP_5XX |

TOP 10 SLOWEST ENDPOINTS
------------------------
| Monitor | Avg Response | Max Response |
|---------|--------------|--------------|
```

### Deliverables
- Scheduled report generation
- PDF, Excel, CSV exports
- Email delivery of reports
- Report management UI

---

## 🔨 PHASE 6: ENTERPRISE FEATURES

**Duration:** Week 11-12
**Goal:** RBAC, maintenance windows, advanced features

### Tasks

#### 6.1 Role-Based Access Control
```
□ Implement role checking middleware
□ Admin vs User permissions
□ Project-level access control
□ API endpoint protection
```

#### 6.2 Maintenance Windows
```
□ Create maintenance window model
□ Implement window checker
□ Suppress alerts during maintenance
□ Show maintenance status on dashboard
```

#### 6.3 Bulk Operations
```
□ Bulk import monitors from CSV
□ Bulk update monitors
□ Bulk delete monitors
□ Export monitors to CSV
```

#### 6.4 Advanced Filtering
```
□ Multi-tag filtering
□ Status + project combined filters
□ Date range filtering
□ Search across all fields
```

#### 6.5 Audit Trail
```
□ Log all CRUD operations
□ Track user actions
□ Activity log viewer
□ Export audit logs
```

#### 6.6 Performance Optimization
```
□ Database query optimization
□ Add appropriate indexes
□ Implement pagination
□ Cache frequently accessed data
```

#### 6.7 Data Retention
```
□ Implement cleanup worker
□ Purge checks older than 7 days
□ Archive old incidents
□ Aggregate historical data
```

### Deliverables
- RBAC system
- Maintenance windows
- Bulk operations
- Audit logging
- Performance optimization

---

## 🔨 PHASE 7: AWS DEPLOYMENT

**Duration:** Week 13-14
**Goal:** Production deployment on AWS

### Tasks

#### 7.1 Terraform Setup
```
□ Initialize Terraform project
□ Configure AWS provider
□ Create module structure
□ Set up state backend (S3)
```

#### 7.2 Networking
```
□ Create VPC
□ Configure subnets (public/private)
□ Set up NAT Gateway
□ Configure security groups
```

#### 7.3 Database (RDS)
```
□ Create RDS PostgreSQL instance
□ Configure security groups
□ Set up backups
□ Create parameter group
```

#### 7.4 Cache (ElastiCache)
```
□ Create Redis cluster
□ Configure security groups
□ Set up encryption
```

#### 7.5 Container Registry (ECR)
```
□ Create ECR repositories
□ Configure lifecycle policies
□ Set up image scanning
```

#### 7.6 Container Service (ECS)
```
□ Create ECS cluster
□ Define task definitions
□ Create services
□ Configure auto-scaling
```

#### 7.7 Load Balancer (ALB)
```
□ Create Application Load Balancer
□ Configure target groups
□ Set up health checks
□ Configure HTTPS
```

#### 7.8 Monitoring & Logging
```
□ Set up CloudWatch logs
□ Create dashboards
□ Configure alarms
□ Set up SNS notifications
```

#### 7.9 CI/CD Pipeline
```
□ Create GitHub Actions workflow
□ Build and push Docker images
□ Deploy to ECS
□ Run database migrations
```

### AWS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                         VPC                                │  │
│  │  ┌─────────────────┐    ┌─────────────────┐              │  │
│  │  │  Public Subnet  │    │  Public Subnet  │              │  │
│  │  │   (us-east-1a)  │    │   (us-east-1b)  │              │  │
│  │  │  ┌───────────┐  │    │  ┌───────────┐  │              │  │
│  │  │  │    ALB    │  │    │  │    NAT    │  │              │  │
│  │  │  └───────────┘  │    │  └───────────┘  │              │  │
│  │  └─────────────────┘    └─────────────────┘              │  │
│  │           │                      │                        │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │              Private Subnets                         │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │  │
│  │  │  │ ECS Fargate │  │     RDS     │  │ ElastiCache │  │ │  │
│  │  │  │   (API)     │  │ (Postgres)  │  │   (Redis)   │  │ │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  │ │  │
│  │  │  ┌─────────────┐                                     │ │  │
│  │  │  │ ECS Fargate │                                     │ │  │
│  │  │  │  (Worker)   │                                     │ │  │
│  │  │  └─────────────┘                                     │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │      S3       │  │      SES      │  │  CloudWatch   │        │
│  │   (Reports)   │  │    (Email)    │  │   (Logging)   │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Deliverables
- Terraform infrastructure code
- Dockerized applications
- CI/CD pipeline
- Production deployment
- Monitoring and alerting

---

## 🧪 TESTING STRATEGY

### Test Types

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit Tests | Vitest | Core logic: 80% |
| Integration Tests | Vitest + Supertest | API endpoints: 70% |
| E2E Tests | Playwright | Critical paths: Key flows |

### Key Test Cases

```
Check Engine:
□ DNS resolution success/failure
□ SSL certificate validation
□ HTTP status code handling
□ Timeout handling
□ Keyword detection
□ RCA categorization

Incident Detection:
□ 3 consecutive failures triggers incident
□ Recovery auto-resolves incident
□ Incident duration calculation
□ Duplicate incident prevention

Notifications:
□ Email delivery
□ Teams webhook delivery
□ Retry on failure
□ Rate limiting

API:
□ Authentication required
□ RBAC enforcement
□ Validation errors
□ Pagination
□ Filtering
```

---

## 📝 DEVELOPMENT GUIDELINES

### For Claude Code

When working with Claude Code, use these patterns:

#### 1. Start Each Session
```
Read CLAUDE.md to understand the project structure and current phase.
Check which tasks are pending in the current phase.
```

#### 2. File Creation Pattern
```
When creating a new file:
1. First check if similar files exist for reference
2. Follow the established patterns in the codebase
3. Add proper TypeScript types
4. Include error handling
5. Add JSDoc comments for complex functions
```

#### 3. API Endpoint Pattern
```typescript
// Standard controller pattern
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = parseFilters(req.query);
      const monitors = await this.monitorService.findAll(filters);
      res.json({ success: true, data: monitors });
    } catch (error) {
      next(error);
    }
  }
}
```

#### 4. Service Pattern
```typescript
// Standard service pattern
export class MonitorService {
  constructor(private prisma: PrismaClient) {}

  async findAll(filters: MonitorFilters): Promise<Monitor[]> {
    return this.prisma.monitor.findMany({
      where: this.buildWhereClause(filters),
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

#### 5. Error Handling Pattern
```typescript
// Use custom error classes
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 404);
  }
}

// In controller
if (!monitor) {
  throw new NotFoundError('Monitor', id);
}
```

### Code Style

```typescript
// Use async/await
async function fetchData() {
  const result = await service.getData();
  return result;
}

// Use early returns
function validateInput(input: Input) {
  if (!input.name) {
    throw new ValidationError('Name is required');
  }
  if (!input.url) {
    throw new ValidationError('URL is required');
  }
  return true;
}

// Use descriptive names
const activeMonitorsByProject = monitors.filter(m => m.isActive);

// Use constants
const MAX_CONSECUTIVE_FAILURES = 3;
const CHECK_TIMEOUT_MS = 30000;
```

### Git Commit Messages

```
feat: add monitor creation API endpoint
fix: resolve race condition in incident detection
refactor: extract RCA builder to separate module
docs: update API documentation
test: add unit tests for check scheduler
chore: update dependencies
```

---

## 🔧 TROUBLESHOOTING

### Common Issues

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### Redis Connection Failed
```bash
# Check if Redis is running
docker-compose ps

# Test connection
docker-compose exec redis redis-cli ping
```

#### Queue Jobs Not Processing
```bash
# Check worker logs
npm run dev:worker

# Check queue status in Redis
docker-compose exec redis redis-cli
> KEYS bull:*
> LLEN bull:check-queue:wait
```

#### Check Failures
```bash
# Test URL manually
curl -v https://example.com

# Check DNS
nslookup example.com

# Check SSL
openssl s_client -connect example.com:443
```

### Debug Mode

```bash
# Run API with debug logging
DEBUG=pulse:* npm run dev:api

# Run specific debug namespaces
DEBUG=pulse:checker,pulse:queue npm run dev:api
```

---

## 📚 RESOURCES

### Documentation
- [Prisma Docs](https://www.prisma.io/docs)
- [BullMQ Docs](https://docs.bullmq.io/)
- [Express Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)

### AWS
- [ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

---

## ✅ CHECKLIST

Use this checklist to track progress:

### Phase 1: Core Foundation
- [ ] Project setup complete
- [ ] Docker Compose working
- [ ] Database schema created
- [ ] Migrations running
- [ ] Authentication working
- [ ] Basic CRUD APIs working

### Phase 2: Check Engine & RCA
- [ ] BullMQ configured
- [ ] Check scheduler running
- [ ] HTTP checker implemented
- [ ] RCA capture working
- [ ] Incident detection working

### Phase 3: Dashboard & UI
- [ ] React app setup
- [ ] Authentication UI
- [ ] Dashboard page
- [ ] Monitors management
- [ ] Real-time updates

### Phase 4: Alerting
- [ ] Email notifications
- [ ] MS Teams integration
- [ ] Webhook support
- [ ] Alert contact management

### Phase 5: Reports
- [ ] Report scheduler
- [ ] PDF generation
- [ ] Excel generation
- [ ] CSV export
- [ ] Report delivery

### Phase 6: Enterprise
- [ ] RBAC implemented
- [ ] Maintenance windows
- [ ] Bulk operations
- [ ] Audit logging
- [ ] Data retention

### Phase 7: AWS
- [ ] Terraform setup
- [ ] Infrastructure deployed
- [ ] CI/CD pipeline
- [ ] Production running

---

## 🎯 SUCCESS CRITERIA

Pulse is complete when:

1. **Monitors**: Can manage 300+ URL monitors with tags and projects
2. **Checks**: 1-minute monitoring interval working reliably
3. **RCA**: Detailed root cause captured for every failure
4. **Alerts**: Email and Teams notifications within 60 seconds
5. **Dashboard**: Real-time status updates, mobile responsive
6. **Reports**: Automated daily/weekly/monthly reports
7. **Access Control**: Admin/User roles enforced
8. **Reliability**: System monitors itself, handles failures gracefully
9. **Performance**: Dashboard loads in <2 seconds
10. **Deployment**: Running on AWS with Terraform

---

*Last Updated: February 2026*
*Version: 1.0*
*Author: Built with Claude AI*
