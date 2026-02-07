<p align="center">
  <img src="docs/logo.png" alt="PULSE" width="200" />
</p>

<h1 align="center">PULSE</h1>
<p align="center"><strong>Enterprise Reliability Monitoring Platform</strong></p>

<p align="center">
  <a href="https://pulse-dashboard.onrender.com">Dashboard</a> |
  <a href="https://pulse-api-q7cs.onrender.com">API</a> |
  <a href="#features">Features</a> |
  <a href="#deployment">Deployment</a>
</p>

---

## Overview

PULSE is an enterprise-grade uptime monitoring platform designed for organizations that demand reliable infrastructure monitoring. Built with modern technologies and designed for scale.

## Features

- **Real-time Monitoring** - HTTP/HTTPS endpoint monitoring with configurable intervals
- **Intelligent Alerting** - Multi-channel notifications via Email, Microsoft Teams, Slack, and Webhooks
- **Root Cause Analysis** - Detailed diagnostics for faster incident resolution
- **Team Management** - Role-based access control with project-level permissions
- **Scheduled Reports** - Automated reports in PDF, Excel, or CSV format
- **Maintenance Windows** - Planned downtime management with alert suppression
- **SSL Monitoring** - Certificate expiration tracking
- **Custom Dashboards** - TV mode for NOC displays

## Technology

| Component | Technology |
|-----------|------------|
| Backend | Node.js, Express, TypeScript |
| Frontend | React, Vite, TailwindCSS |
| Database | PostgreSQL |
| Cache | Redis |
| ORM | Prisma |

## Deployment

Hosted on Render.com with automatic deployments from the `main` branch.

```bash
# Clone and setup
git clone https://github.com/p05-cloud/pulse-monitoring.git
cd pulse-monitoring

# Start infrastructure
docker-compose up -d

# Install and run
npm install
cd apps/api
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## Environment

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret |
| `RESEND_API_KEY` | Email service API key |

## API

Base URL: `https://pulse-api-q7cs.onrender.com/api/v1`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | Authentication |
| `GET /monitors` | List monitors |
| `GET /incidents` | List incidents |
| `GET /dashboard/summary` | Dashboard metrics |

---

<p align="center">
  <strong>PULSE Monitoring Platform</strong><br/>
  Created by <strong>Pushpak Patil</strong>
</p>

<p align="center">
  <a href="mailto:pushpak.patil@acc.ltd">pushpak.patil@acc.ltd</a>
</p>

<p align="center">
  &copy; 2024-2026 All rights reserved.
</p>
