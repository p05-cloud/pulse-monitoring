# Resend Email Setup Guide

PULSE uses [Resend](https://resend.com) for email notifications - a modern, developer-friendly email API that's much simpler than traditional SMTP.

## Why Resend?

✅ **No SMTP configuration** - Just one API key
✅ **3,000 free emails/month** - Perfect for monitoring
✅ **Better deliverability** - Built for transactional emails
✅ **Easy debugging** - Clear logs and error messages
✅ **Simple API** - 3 lines of code vs 10+ with SMTP

---

## Quick Setup (5 Minutes)

### 1. Create Resend Account

1. Go to https://resend.com
2. Click "Get Started"
3. Sign up with GitHub or email
4. Confirm your email

### 2. Get API Key

1. After logging in, click **API Keys** in sidebar
2. Click **Create API Key**
3. Name it: `PULSE Monitoring`
4. Permission: `Full Access` (or `Sending access` if restricted)
5. Click **Add**
6. **Copy the API key** (starts with `re_`)

⚠️ **Important**: Save this key now - you can't see it again!

### 3. Configure PULSE

Edit `apps/api/.env`:

```bash
# Replace with your actual API key
RESEND_API_KEY=re_abc123xyz456

# For testing (no domain needed)
EMAIL_FROM=PULSE Monitoring <onboarding@resend.dev>

# OR with your own domain (after verification)
EMAIL_FROM=PULSE Monitoring <noreply@yourdomain.com>
```

### 4. Test It

```bash
cd apps/api
npm run dev
```

Then test with the API:

```bash
curl -X POST http://localhost:3001/api/v1/alert-contacts/:id/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

You should receive a test email! 📧

---

## Domain Setup (Optional - For Production)

### Why Add a Domain?

- Professional "from" address (your domain)
- Better deliverability
- No "via resend.dev" in email clients
- Required for production use

### Steps:

1. **In Resend Dashboard**:
   - Go to **Domains** → **Add Domain**
   - Enter your domain (e.g., `yourdomain.com`)
   - Click **Add**

2. **Add DNS Records**:
   Resend will show you DNS records to add. Go to your DNS provider (Cloudflare, Namecheap, etc.) and add:

   ```
   Type: TXT
   Name: @
   Value: resend._domainkey.yourdomain.com

   Type: MX
   Name: @
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10
   ```

3. **Verify**:
   - Wait 5-10 minutes for DNS propagation
   - Click **Verify** in Resend dashboard
   - Status should change to "Verified" ✅

4. **Update .env**:
   ```bash
   EMAIL_FROM=PULSE Monitoring <noreply@yourdomain.com>
   ```

---

## Usage in PULSE

### Email Templates

PULSE includes professional HTML templates for:

- **DOWN** - Red alert when monitor goes down
- **UP** - Green recovery notification
- **DEGRADED** - Yellow warning for slow response
- **ACKNOWLEDGED** - Blue notification when incident acknowledged

### Example Notifications

**DOWN Email**:
```
Subject: 🔴 [PULSE] DOWN: Production API

Monitor: Production API
URL: https://api.example.com
Status: DOWN
Error: HTTP_5XX - Internal Server Error

Root Cause Analysis:
DNS: 45ms ✓
TCP: 120ms ✓
TLS: 200ms ✓
HTTP: 500ms ✗ (500 Internal Server Error)

[View Incident Details] button
```

**UP Email**:
```
Subject: ✅ [PULSE] RECOVERED: Production API

Great news! Your monitor is back online.

Monitor: Production API
Status: UP
Downtime: 5m 32s

[View Monitor Details] button
```

---

## Troubleshooting

### "RESEND_API_KEY not set"

**Problem**: API key not configured
**Solution**: Check `.env` file has `RESEND_API_KEY=re_...`

### "Email not sending"

**Check**:
1. Is API key valid? (test in Resend dashboard)
2. Is `EMAIL_FROM` correct?
3. For custom domains: Is domain verified?
4. Check logs: `tail -f apps/api/logs/all.log | grep Email`

### "Invalid from address"

**Problem**: Using unverified domain
**Solution**: Either:
- Use `onboarding@resend.dev` for testing
- Verify your domain in Resend dashboard

### Rate Limiting

**Free tier limits**:
- 3,000 emails/month
- 100 emails/day

**If exceeded**:
- Upgrade to paid plan ($20/month for 50,000 emails)
- Or wait until next month

---

## Alternative Email Services

If you prefer different service, PULSE can be adapted to use:

| Service | Free Tier | Setup Difficulty |
|---------|-----------|------------------|
| **Resend** ⭐ | 3,000/month | Easiest (current) |
| SendGrid | 100/day | Easy |
| Mailgun | 5,000/month | Easy |
| AWS SES | $0.10/1000 | Medium |
| Postmark | 100/month | Easy |

To switch services, edit `apps/api/src/execution/notifiers/email.notifier.ts`

---

## Pricing

### Free Tier
- **3,000 emails/month**
- **100 emails/day**
- All features included
- Perfect for small-medium monitoring setups

### Paid Plans
- **Pro**: $20/month
  - 50,000 emails/month
  - 1,000 emails/day
  - Custom domains
  - Better support

- **Enterprise**: Custom pricing
  - Unlimited emails
  - Dedicated IP
  - SLA

For monitoring 100-200 endpoints with ~5 incidents/day:
- ~150 emails/month (DOWN + UP notifications)
- **Free tier is plenty!** 🎉

---

## Monitoring Best Practices

### 1. Use Digest Emails
Instead of sending email for every single check failure, send:
- First failure: Immediate email
- Subsequent failures: Skip (already notified)
- Recovery: Email

This is **already implemented** in PULSE incident detection (3-failure rule).

### 2. Maintenance Windows
Use maintenance windows to suppress alerts during planned downtime:
```bash
curl -X POST http://localhost:3001/api/v1/maintenance-windows \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Weekend Maintenance",
    "monitorIds": ["..."],
    "startTime": "...",
    "endTime": "..."
  }'
```

### 3. MS Teams for Urgent Alerts
Use Teams for critical monitors, email for everything else.

---

## Support

- **Resend Docs**: https://resend.com/docs
- **Resend Status**: https://status.resend.com
- **Support**: support@resend.com

---

## Next Steps

1. ✅ Get Resend API key
2. ✅ Add to `.env`
3. ✅ Test with `/test` endpoint
4. 🔄 (Optional) Verify custom domain
5. 🚀 Start monitoring!

Happy monitoring! 📊
