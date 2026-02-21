# PULSE — API & Uptime Monitoring Platform
### by Applied Cloud Computing (ACC)

---

## The Problem

Modern businesses run on APIs. When they go down, revenue stops, customers complain, and teams scramble to find out why — often wasting precious minutes figuring out *where* the failure actually is.

Existing tools tell you **that** something is broken. They don't tell you **why**.

- "Your site is down" — but is it DNS? SSL expired? The database? A bad deploy?
- Generic uptime tools send one alert. Your team still has to debug manually.
- SaaS monitoring tools like Pingdom or Datadog can't reach your **private internal APIs** — APIs that live inside your VPN or AWS VPC.
- Enterprise tools cost ₹5–50L per year per client. Overkill for most.

---

## What is Pulse?

**Pulse is an enterprise-grade API and uptime monitoring platform** built by ACC, deployed on your infrastructure, monitoring all your client endpoints from a single dashboard.

It doesn't just tell you *that* an API is down — it pinpoints exactly *why*, at the network layer, in seconds.

**Live today at:** https://pulse-dashboard.onrender.com

**Currently monitoring:** 7 enterprise clients, 46+ endpoints, running 24×7.

---

## Core Capabilities

### 1. Deep Root Cause Analysis (RCA)
Every failed check triggers a 5-phase diagnostic:

| Phase | What it checks |
|---|---|
| DNS | Can the hostname be resolved? |
| TCP | Can a connection be established? |
| TLS/SSL | Is the certificate valid? Has it expired? |
| HTTP | Is the response code correct? |
| Keyword | Is the expected content in the response body? |

**Result:** Instead of "API is down", your team sees:
*"TLS handshake failed — certificate expired 2 days ago for api.client.com"*

---

### 2. Public API Monitoring
Monitor any public HTTP/HTTPS endpoint:

- **Methods:** GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Custom headers** (API keys, Bearer tokens, auth headers)
- **Request body** support for authenticated endpoints
- **Configurable intervals:** every 1 minute to 1 hour
- **Expected status code** customisation (200, 201, 204, etc.)
- **Response keyword matching** — validate the content, not just the status

---

### 3. Private API Monitoring (AWS VPC Bridge)
**This is our key differentiator.**

No SaaS monitoring tool can monitor APIs that aren't publicly accessible. Pulse solves this with a zero-agent AWS approach:

```
[Pulse Dashboard]  ←──────────────────────────────────────────
                                                             |
[API Gateway]  (public HTTPS endpoint)  ←──────────────────  |
                                                        |     |
[Lambda Function]  (runs inside client VPC)  ──────────┘     |
     ↓  ↓  ↓                                                  |
[Private API 1]  [Private API 2]  [Private API N]             |
(not publicly accessible)                                     |
                                                              |
[Pulse monitors the single API Gateway URL]  ─────────────────┘
```

**How it works:**
1. Deploy a single CloudFormation stack into the client's AWS account (5 minutes, no agents, no persistent infrastructure)
2. A Lambda function runs *inside the client's VPC* — it can reach internal services
3. It checks all private APIs in parallel and returns a single aggregated health response
4. Pulse monitors the API Gateway URL — one monitor covers 10, 20, 50 internal services
5. If any internal service goes down, Pulse alerts immediately

**Client gets:** Full visibility into private APIs with zero ongoing maintenance and no per-check fees.

---

### 4. Incident Management
Full incident lifecycle — not just "we sent you an alert":

- **Auto-detection:** 3 consecutive failures trigger an incident (avoids false positives)
- **Acknowledge:** Team member claims ownership ("I'm looking at this")
- **Resolve:** Mark as fixed with timestamp
- **Timeline:** Full history of when it started, who responded, when it recovered
- **Duration tracking:** How long was it down? (critical for SLA reporting)

---

### 5. Multi-Channel Alerting
Instant notifications when something breaks, with **full RCA details inline**:

- **Email** — formatted alert with DNS/TCP/TLS/HTTP breakdown, recovery notifications
- **Microsoft Teams** — rich adaptive cards, colour-coded (red/green/yellow), links to incident
- **Custom Webhooks** — POST to any endpoint (PagerDuty, ServiceNow, your own systems)

---

### 6. SSL Certificate Monitoring
Tracks SSL expiry for every monitored HTTPS endpoint:

- Detects expired certificates before they cause outages
- Included in every check — no additional configuration
- RCA flags the exact error: `SSL_CERTIFICATE_EXPIRED`, `SSL_HOSTNAME_MISMATCH`, etc.

---

### 7. Maintenance Windows
Schedule planned downtime — alerts are suppressed during the window:

- Define start/end time for maintenance
- Monitors continue checking but don't trigger false alerts
- Automatically resumes normal alerting after the window closes

---

### 8. TV/NOC Dashboard
A full-screen, real-time status board for operations centres or client-facing screens:

- Configurable widget layout (uptime gauges, response time charts, incident counters)
- Auto-refreshes live — no interaction needed
- Designed for wall-mounted displays and operations rooms

---

### 9. Multi-Client Project Isolation
Built from the ground up for MSPs and IT service companies managing multiple clients:

- Each **client = one Project** — completely isolated data
- Role-based access: **Admin, Developer, Viewer** per project
- Team invitations with expiring tokens
- Aggregated dashboard shows all clients at a glance with health indicators
- Single Pulse instance, many clients — no per-client infrastructure

---

### 10. Automated Reporting
Scheduled reports delivered automatically:

- **Formats:** PDF, Excel (.xlsx), CSV
- **Frequency:** Daily, Weekly, Monthly
- **Content:** Uptime %, avg response time, incidents count, downtime minutes — per monitor and per project
- **Email delivery:** Auto-sent to configured recipients
- **Excel highlights:** Uptime cells colour-coded (green ≥99.9%, yellow ≥99%, red below)

---

## How It's Built

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 (Prisma ORM) |
| Queue | Redis + BullMQ (job-based execution) |
| Hosting | Render.com (scales to AWS/GCP/Azure on request) |
| Private monitoring | AWS Lambda + API Gateway (CloudFormation template) |

**Architecture highlights:**
- Event-driven, queue-based check execution — handles thousands of monitors without blocking
- 10 concurrent check workers, 5 concurrent notification workers
- Graceful failure handling — retries with backoff, detailed error logging
- 7-day check history retention with daily cleanup

---

## What Clients See Today

**Live production data (as of Feb 2026):**

| Client | Monitors | Status |
|---|---|---|
| Tata Power | 21 | Monitored |
| Tata Mutual Funds | 13 | Monitored |
| ITSM | 4 | Monitored |
| Vistaar | 2 | Monitored |
| SystemX – Tata Capital | 4 | Monitored |
| ACC-Digi-Atlas | 1 | Monitored |
| APAC Fin | 1 | Monitored |

**Total:** 46+ active monitors, running 24×7.

---

## The Business Case

### For Your Client

| Pain Point | Pulse Solution |
|---|---|
| "We don't know when our APIs go down" | Real-time monitoring every 1–5 min, instant Teams/email alert |
| "We waste 20 min figuring out why" | RCA pinpoints the layer (DNS/SSL/TCP/HTTP) in the alert itself |
| "Our internal APIs aren't monitored" | Lambda VPC bridge monitors private APIs without agents |
| "We have no SLA reporting" | Automated monthly PDF/Excel reports with uptime % per service |
| "We need a status board for our ops team" | TV dashboard, wall-ready, real-time |

### For ACC (You)

- **Differentiated service offering:** No other MSP in your space is offering private endpoint monitoring via Lambda VPC bridge
- **Recurring engagement:** Clients need ongoing monitoring — natural monthly retainer
- **Upsell path:** Start with public API monitoring → expand to private APIs → add reporting → add more monitors
- **Low marginal cost:** One Pulse instance handles unlimited clients. No per-check SaaS fees.
- **Client stickiness:** Once a client's monitoring is set up and alerting their team, switching cost is high

---

## Deployment Options

### Option A — Hosted by ACC (Recommended for pilot)
- Pulse runs on ACC's infrastructure
- Client gets a login, their own project, isolated data
- No setup required on client side
- Monthly monitoring fee to ACC

### Option B — Deployed in Client's AWS Account
- Full Pulse stack deployed in client's VPC
- Complete data sovereignty
- Client owns the infrastructure
- ACC provides setup, support, and customisation

---

## Pricing Positioning

| Competitor | Model | Approx Cost |
|---|---|---|
| Pingdom | SaaS, per-check | ₹5,000–50,000/month |
| Datadog APM | SaaS, per-host | ₹10,000–1,00,000+/month |
| Better Uptime | SaaS, per monitor | ₹3,000–30,000/month |
| **Pulse (ACC)** | **Self-hosted, per-client** | **Flat engagement fee** |

**The Pulse advantage:** No per-check or per-monitor fees. One setup, unlimited monitors for the client. Price it as a managed service, not a SaaS subscription.

---

## Demo Flow (15 minutes)

1. **Dashboard overview** (2 min) — Show all clients, uptime indicators, incident count
2. **Root Cause Analysis** (3 min) — Open an incident, expand RCA panel, show DNS/TCP/TLS/HTTP drill-down
3. **Incident lifecycle** (2 min) — Acknowledge → Resolve, show timeline
4. **TV dashboard** (1 min) — Switch to full-screen NOC view
5. **Maintenance window** (1 min) — Show scheduled downtime suppression
6. **Teams notification** (2 min) — Show a sample alert card with RCA details inline
7. **Private API bridge** (3 min) — Show the architecture diagram, explain Lambda VPC approach, show the monitor that covers 10 internal services with one URL
8. **Reports** (1 min) — Show scheduled reporting, PDF/Excel output

**Key message to close:** *"You're getting enterprise monitoring — RCA, incident management, private APIs, reports — at a fraction of what Datadog or Pingdom would cost. And it's running on your infrastructure, so you own the data."*

---

## What's Coming Next

- **Slack notifications** (backend complete, UI coming)
- **SLA breach alerting** — auto-alert when monthly uptime drops below target
- **Client-facing status page** — public status page for each project
- **Response time alerting** — alert when response time exceeds threshold even if status is 200
- **Multi-region checking** — check from Mumbai, Singapore, US simultaneously
- **Reports UI** — in-app report scheduling and download

---

## FAQ

**Q: Can it monitor APIs that require authentication?**
A: Yes — custom headers (Bearer tokens, API keys, Basic auth) and request body (for OAuth flows) are supported per monitor.

**Q: What happens if Pulse itself goes down?**
A: Pulse runs on Render.com with automatic restart. For enterprise clients, it can be deployed on AWS with auto-scaling and multi-AZ redundancy.

**Q: How is this different from AWS CloudWatch?**
A: CloudWatch monitors AWS resources (EC2, Lambda, RDS). Pulse monitors HTTP/HTTPS API endpoints — any endpoint, any cloud, any vendor. It also provides RCA, incident management, team collaboration, and reporting that CloudWatch doesn't.

**Q: Is the data secure?**
A: Yes. JWT authentication, HTTPS-only, Helmet security headers, rate limiting, CORS restrictions, and per-client project isolation. The Lambda VPC bridge runs entirely inside the client's own AWS account.

**Q: Can we white-label it?**
A: The platform carries ACC branding today. Custom domain and logo per client is feasible with configuration changes.

---

*Built by Applied Cloud Computing · https://pulse-dashboard.onrender.com*
*Contact: pushpak.patil@acc.ltd*
