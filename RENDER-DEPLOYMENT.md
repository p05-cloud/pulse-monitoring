# PULSE - Render.com Deployment Guide

Complete guide to deploy PULSE monitoring platform to Render.com for team testing and validation.

---

## 🎯 Overview

**Goal**: Deploy PULSE to Render.com for team testing before AWS production

**What Gets Deployed**:
- ✅ PULSE API (web service)
- ✅ PostgreSQL Database
- ✅ Redis (cache & queues)
- ✅ Auto-deploy from Git
- ✅ HTTPS included

**Cost**: **FREE** (for 90 days, then ~$7/month for database)

---

## 📋 Prerequisites

Before starting, have these ready:

1. ✅ **GitHub Account** (to push code)
2. ✅ **Render.com Account** (sign up free)
3. ✅ **Resend API Key** (from resend.com)
4. ⏱️ **15 minutes** of your time

---

## 🚀 Step-by-Step Deployment

### Step 1: Push Code to GitHub

**1.1 Create GitHub Repository**

Go to https://github.com/new and create a new repository:
- Name: `pulse-monitoring` (or your choice)
- Visibility: Private (recommended) or Public
- Don't initialize with README (we have one)

**1.2 Push Your Code**

```bash
cd /Users/alex/Documents/Pulse-App

# Initialize git (if not already)
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/pulse-monitoring.git

# Add all files
git add .

# Commit
git commit -m "Initial commit - PULSE monitoring platform"

# Push to GitHub
git push -u origin main
```

**Verify**: Visit your GitHub repo - all files should be there!

---

### Step 2: Sign Up for Render.com

**2.1 Create Account**

1. Go to https://render.com
2. Click **Get Started**
3. Sign up with GitHub (recommended - easier integration)
4. Authorize Render to access GitHub

**2.2 Connect Repository**

1. In Render Dashboard, you'll see your GitHub repos
2. Render will ask for permission to access repos
3. Select "All repositories" or just `pulse-monitoring`

---

### Step 3: Deploy from Blueprint

**3.1 Create New Blueprint**

1. In Render Dashboard, click **New +** → **Blueprint**
2. Select your `pulse-monitoring` repository
3. Render will detect `render.yaml` file automatically
4. Click **Apply**

**What Happens**:
- Render reads `render.yaml`
- Creates 3 services:
  - `pulse-api` (Web Service)
  - `pulse-postgres` (PostgreSQL Database)
  - `pulse-redis` (Redis Cache)

**3.2 Wait for Creation** (~2 minutes)

You'll see:
```
✓ Created database: pulse-postgres
✓ Created redis: pulse-redis
✓ Created web service: pulse-api
```

---

### Step 4: Configure Environment Variables

**IMPORTANT**: You must set the Resend API key manually.

**4.1 Get Resend API Key**

If you haven't already:
1. Go to https://resend.com
2. Sign up (free)
3. API Keys → Create API Key
4. Copy the key (starts with `re_`)

**4.2 Add to Render**

1. In Render Dashboard, click on **pulse-api** service
2. Go to **Environment** tab
3. Find `RESEND_API_KEY`
4. Click **Edit**
5. Paste your Resend API key
6. Click **Save Changes**

**4.3 Verify Other Variables**

Check these are set (should be auto-filled):
- ✅ `DATABASE_URL` - Auto from postgres
- ✅ `REDIS_HOST` - Auto from redis
- ✅ `REDIS_PORT` - Auto from redis
- ✅ `JWT_SECRET` - Auto-generated
- ✅ `JWT_REFRESH_SECRET` - Auto-generated
- ✅ `NODE_ENV=production`
- ✅ `PORT=3001`

---

### Step 5: Deploy!

**5.1 Trigger Deployment**

After saving env vars, Render will automatically redeploy.

Or manually trigger:
1. Go to **pulse-api** service
2. Click **Manual Deploy** → **Deploy latest commit**

**5.2 Watch Build Logs** (~3-5 minutes)

You'll see:
```
Building PULSE API...
Installing dependencies...
Generating Prisma client...
Building TypeScript...
Build completed successfully!

Starting deployment...
Running database migrations...
Applying performance indexes...
Starting server...
✅ Health check passed
```

**5.3 Deployment Complete!**

When you see:
```
🚀 PULSE API server running on port 3001
✅ Database connected successfully
✅ Redis connected successfully
✅ All workers running
```

You're live! 🎉

---

### Step 6: Get Your URL

**6.1 Find Service URL**

1. In Render Dashboard, click **pulse-api**
2. At the top, you'll see your URL:
   ```
   https://pulse-api-XXXX.onrender.com
   ```
3. Copy this URL

**6.2 Test It**

```bash
# Health check
curl https://pulse-api-XXXX.onrender.com/health

# Should return:
{"status":"ok","timestamp":"2024-02-07T..."}
```

✅ **IT WORKS!**

---

### Step 7: Create First User & Test

**7.1 Seed Database** (Optional but recommended)

SSH into the service to run seed:

1. In Render Dashboard, go to **pulse-api**
2. Click **Shell** tab
3. Run:
   ```bash
   cd apps/api
   npx tsx scripts/seed.ts
   ```

This creates:
- Admin user: `admin@pulse.local` / `password`
- 3 projects
- 10 sample monitors
- 2 alert contacts

**7.2 Test Login**

```bash
# Replace XXXX with your actual URL
curl -X POST https://pulse-api-XXXX.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pulse.local",
    "password": "password"
  }'
```

You should get a JWT token! 🎉

---

### Step 8: Share with Team

**8.1 Share API URL**

Give your team:
```
API URL: https://pulse-api-XXXX.onrender.com
Login: admin@pulse.local
Password: password
```

**8.2 Test with Postman/Insomnia**

Share this Postman collection:
```json
{
  "baseUrl": "https://pulse-api-XXXX.onrender.com/api/v1",
  "auth": {
    "type": "bearer",
    "bearer": [{"key": "token", "value": "{{token}}"}]
  }
}
```

**8.3 Monitor Usage**

In Render Dashboard:
- **Metrics** tab - CPU, memory, requests
- **Logs** tab - Real-time application logs
- **Events** tab - Deployments, crashes

---

## 🔧 Making Changes

### Update Code

```bash
# Make your changes locally
git add .
git commit -m "Fix: update email template"
git push

# Render auto-deploys within ~3 minutes
```

### View Deploy Logs

1. Render Dashboard → **pulse-api**
2. **Events** tab → Click latest deployment
3. Watch live build logs

### Rollback if Needed

1. **Events** tab
2. Find working deployment
3. Click **Redeploy**

---

## 📊 Monitoring & Debugging

### View Application Logs

**Real-time**:
1. Render Dashboard → **pulse-api**
2. **Logs** tab
3. Filter by:
   - ✅ All logs
   - ⚠️  Errors only
   - 📝 Custom search

**Example filters**:
```
Check Worker     # See monitoring activity
Notification     # See email sends
Error            # See errors
```

### Database Access

**Option 1: Render Shell**
1. Dashboard → **pulse-api**
2. **Shell** tab
3. Run:
   ```bash
   psql $DATABASE_URL
   ```

**Option 2: External Tool** (TablePlus, DBeaver)
1. Dashboard → **pulse-postgres**
2. **Info** tab → Copy **External Connection String**
3. Use in your DB tool

**View Data**:
```sql
-- Check monitors
SELECT id, name, url, current_status FROM monitors;

-- Check recent incidents
SELECT * FROM incidents ORDER BY started_at DESC LIMIT 10;

-- Check notifications sent
SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 20;
```

### Redis Access

1. Dashboard → **pulse-redis**
2. **Shell** tab
3. Run:
   ```bash
   redis-cli
   > KEYS *
   > LLEN bull:check-queue:wait
   ```

---

## 💰 Cost Breakdown

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Web Service** | Free | $0/month | 750 hours/month (enough!) |
| **PostgreSQL** | Free → Starter | Free 90 days, then $7/month | Includes backups |
| **Redis** | Free | $0/month | 25MB (plenty for queues) |
| **HTTPS** | Included | $0 | Auto SSL certificate |
| **Custom Domain** | Free | $0 | Optional |
| **Total** | | **$0 → $7/month** | After 90 days |

**Notes**:
- Free tier sleeps after 15 min inactivity (wakes in ~30 seconds)
- Paid plan ($7/month) = no sleep, better performance
- Can upgrade anytime in dashboard

---

## 🚨 Troubleshooting

### Build Fails

**Error**: `npm install failed`
**Fix**: Check `package.json` syntax, run `npm install` locally first

**Error**: `Prisma generate failed`
**Fix**: Ensure `DATABASE_URL` is set correctly

### Deploy Fails

**Error**: `Health check timeout`
**Fix**: Check logs for errors, verify `/health` endpoint works

**Error**: `Port binding failed`
**Fix**: Ensure app listens on `process.env.PORT` (should be 3001)

### Database Issues

**Error**: `Connection refused`
**Fix**: Check `DATABASE_URL` in environment variables

**Error**: `Migrations failed`
**Fix**: SSH into shell, run `npx prisma migrate deploy` manually

### Email Not Sending

**Error**: `RESEND_API_KEY not set`
**Fix**: Add Resend API key in Environment tab

**Test**:
```bash
# Check email configuration
curl https://pulse-api-XXXX.onrender.com/api/v1/alert-contacts/:id/test \
  -H "Authorization: Bearer TOKEN"
```

### Service Sleeping (Free Tier)

**Issue**: First request slow (~30 seconds)
**Cause**: Free tier sleeps after 15 min inactivity
**Solutions**:
- Upgrade to $7/month plan (no sleep)
- Use UptimeRobot to ping every 5 minutes
- Accept 30s wake time (fine for testing)

---

## 🔐 Security Checklist

Before sharing with team:

- [ ] Change default password for `admin@pulse.local`
- [ ] Set strong `JWT_SECRET` (auto-generated, verify it's not default)
- [ ] Verify database is not publicly accessible
- [ ] Add team members as Render users (optional)
- [ ] Enable 2FA on Render account
- [ ] Review environment variables for secrets
- [ ] Test that only authenticated requests work

---

## 🎯 Testing Checklist

Share this with your team:

### Basic Tests
- [ ] Can access `https://pulse-api-XXXX.onrender.com/health`
- [ ] Can login with credentials
- [ ] Can create a new monitor
- [ ] Can view monitors list
- [ ] Can create alert contact
- [ ] Can test email notification

### Monitoring Tests
- [ ] Create monitor with bad URL (trigger incident)
- [ ] Wait 3 minutes (3 check failures)
- [ ] Verify incident created
- [ ] Verify email notification received
- [ ] Fix URL or delete monitor
- [ ] Verify recovery email received

### Bulk Operations
- [ ] Export monitors to CSV
- [ ] Import monitors from CSV
- [ ] Bulk pause monitors
- [ ] Bulk resume monitors

### Reports
- [ ] Generate on-demand CSV report
- [ ] Schedule daily report
- [ ] Verify report email received

---

## 📈 Next Steps

After team validation:

1. ✅ **Collect Feedback** - Track issues, feature requests
2. ✅ **Make Improvements** - Fix bugs, add features
3. ✅ **Test Thoroughly** - Ensure stability
4. ✅ **Deploy Frontend** - Add React dashboard to Render
5. ✅ **Custom Domain** - Add your domain (optional)
6. 🚀 **AWS Production** - When ready for scale

---

## 🔄 Updating After Feedback

When team reports issues:

```bash
# 1. Make fix locally
# Fix the bug in your code

# 2. Test locally (if you want)
npm run dev

# 3. Commit and push
git add .
git commit -m "Fix: issue reported by team"
git push

# 4. Render auto-deploys in ~3 minutes
# Team can test the fix immediately!
```

---

## 📚 Useful Commands

### View Logs
```bash
# In Render Shell
tail -f /var/log/render.log

# Filter for errors
grep -i error /var/log/render.log
```

### Database Operations
```bash
# Run migrations
npx prisma migrate deploy

# Seed database
npx tsx scripts/seed.ts

# View schema
npx prisma studio  # Opens web UI
```

### Queue Monitoring
```bash
# Redis shell
redis-cli

# Check queue lengths
LLEN bull:check-queue:wait
LLEN bull:notification-queue:wait
LLEN bull:report-queue:wait

# View failed jobs
LLEN bull:check-queue:failed
```

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Health endpoint returns 200 OK
✅ Can login and get JWT token
✅ Can create and view monitors
✅ Check scheduler runs every minute
✅ Incidents created after 3 failures
✅ Email notifications sent successfully
✅ All workers running (check logs)
✅ Database persists data
✅ Redis queues processing jobs

---

## 📞 Getting Help

**Render Issues**:
- Docs: https://render.com/docs
- Community: https://community.render.com
- Support: support@render.com

**PULSE Issues**:
- Check logs in Render Dashboard
- Review this guide
- Test locally first
- Check environment variables

---

## 🚀 Ready to Deploy?

Follow the steps in order:

1. ✅ Push to GitHub
2. ✅ Sign up for Render
3. ✅ Deploy from Blueprint
4. ✅ Add Resend API key
5. ✅ Wait for deployment
6. ✅ Test the API
7. ✅ Share with team
8. ✅ Collect feedback

**You got this!** 🎯

Any issues? Check the troubleshooting section above.

---

**Deployment time**: ~15 minutes
**Team testing**: Ready immediately after deployment
**AWS migration**: Easy when you're ready (all code is AWS-ready)
