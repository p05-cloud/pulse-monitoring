# 🚀 Deploy PULSE to Render.com - Quick Start

Follow these steps in order. Takes ~15 minutes total.

---

## Step 1: Push to GitHub (3 minutes)

```bash
# Navigate to project
cd /Users/alex/Documents/Pulse-App

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - PULSE monitoring platform"

# Create repo on GitHub: https://github.com/new
# Name it: pulse-monitoring (or your choice)

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/pulse-monitoring.git

# Push
git push -u origin main
```

✅ **Verify**: Visit GitHub - all files should be there

---

## Step 2: Sign Up for Render (2 minutes)

1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub
4. Authorize Render to access repositories

✅ **Verify**: You're in Render Dashboard

---

## Step 3: Deploy (5 minutes)

### 3.1 Create Blueprint

1. In Render Dashboard: **New +** → **Blueprint**
2. Select your `pulse-monitoring` repo
3. Click **Apply**

Render will create:
- ✅ pulse-api (Web Service)
- ✅ pulse-postgres (Database)
- ✅ pulse-redis (Cache)

Wait ~2 minutes for creation.

### 3.2 Get Resend API Key

1. Go to https://resend.com
2. Sign up (free)
3. **API Keys** → **Create API Key**
4. Copy the key (starts with `re_`)

### 3.3 Add Resend Key to Render

1. Render Dashboard → Click **pulse-api**
2. **Environment** tab
3. Find `RESEND_API_KEY`
4. Click **Edit**
5. Paste your key
6. **Save Changes**

Service will auto-redeploy (~3 minutes).

✅ **Verify**: Watch **Logs** tab for "Build completed successfully!"

---

## Step 4: Test It (2 minutes)

### 4.1 Get Your URL

1. Render Dashboard → **pulse-api**
2. Copy the URL at top: `https://pulse-api-XXXX.onrender.com`

### 4.2 Test Health

```bash
curl https://pulse-api-XXXX.onrender.com/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### 4.3 Seed Database (Optional)

1. Render Dashboard → **pulse-api**
2. **Shell** tab
3. Run:
```bash
cd apps/api
npx tsx scripts/seed.ts
```

Creates admin user and sample data.

### 4.4 Test Login

```bash
curl -X POST https://pulse-api-XXXX.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulse.local","password":"password"}'
```

You'll get a JWT token! 🎉

---

## Step 5: Share with Team (1 minute)

Give your team:

```
API URL: https://pulse-api-XXXX.onrender.com
Login: admin@pulse.local
Password: password

Docs: https://pulse-api-XXXX.onrender.com/health
```

They can test with Postman/curl!

---

## ✅ You're Done!

**What's Running**:
- ✅ PULSE API on Render
- ✅ PostgreSQL database
- ✅ Redis cache/queues
- ✅ Check scheduler (every minute)
- ✅ Notification worker (email)
- ✅ Report worker
- ✅ Cleanup worker (daily)

**Cost**: FREE (for 90 days, then $7/month)

---

## 📚 Full Guides

- **Complete Guide**: [RENDER-DEPLOYMENT.md](RENDER-DEPLOYMENT.md)
- **Environment Vars**: [RENDER-ENV-VARS.md](RENDER-ENV-VARS.md)
- **Email Setup**: [RESEND-SETUP.md](RESEND-SETUP.md)

---

## 🔄 Making Changes

After team feedback:

```bash
# Make changes locally
# ... edit code ...

# Commit and push
git add .
git commit -m "Fix: issue from team feedback"
git push

# Render auto-deploys in ~3 minutes!
```

---

## 🚨 Troubleshooting

### Build Fails
- Check GitHub repo has all files
- Verify `package.json` is correct
- Check **Logs** tab in Render

### Email Not Working
- Verify `RESEND_API_KEY` is set
- Check it's a valid key from resend.com
- Test in Render **Shell**: `echo $RESEND_API_KEY`

### Can't Access API
- Check service is "Live" (green dot)
- Wait if it's deploying
- Free tier wakes in ~30s if sleeping

---

## 📊 Monitoring

### View Logs
Render Dashboard → **pulse-api** → **Logs**

### Check Database
Render Dashboard → **pulse-api** → **Shell**
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM monitors;"
```

### Monitor Requests
Render Dashboard → **pulse-api** → **Metrics**

---

## 🎯 Next Steps

After team validation:

1. ✅ Deploy Frontend (React Dashboard)
2. ✅ Add custom domain (optional)
3. ✅ Collect team feedback
4. ✅ Iterate and improve
5. 🚀 Deploy to AWS when ready for production scale

---

## 💡 Pro Tips

- **Free tier sleeps** after 15 min inactivity (wakes in ~30s)
- **Upgrade to $7/month** for no sleep + better performance
- **View real-time logs** to debug issues
- **Use Shell tab** for database queries
- **Auto-deploys** happen on every git push

---

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Blueprint deployed successfully
- [ ] `RESEND_API_KEY` added
- [ ] Health endpoint returns 200 OK
- [ ] Can login with credentials
- [ ] Team has been notified
- [ ] Monitoring team feedback

---

**Ready to deploy? Follow Step 1 above!** 🚀

Questions? See [RENDER-DEPLOYMENT.md](RENDER-DEPLOYMENT.md) for detailed guide.
