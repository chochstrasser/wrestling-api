# 🚀 Quick Start: Put Your API in Production

## Fastest Path: Railway (5 minutes, No CLI needed)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
# Create repo on github.com, then:
git remote add origin https://github.com/YOUR-USERNAME/wrestling-api.git
git push -u origin main
```

### 2. Deploy on Railway.app
1. Go to https://railway.app → Login with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `wrestling-api` repo
4. **Done!** Your API is deploying

### 3. Add Database
- In Railway dashboard: Click "New" → "Database" → "PostgreSQL"
- Railway auto-connects it

### 4. Add Environment Variables
- Click your web service → "Variables" tab
- Add: `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET`

### 5. Generate Public URL
- Settings → Networking → "Generate Domain"
- Your API: `https://wrestling-api-production.up.railway.app`

### 6. Test It
```bash
curl https://YOUR-URL.railway.app/
```

**Your API is LIVE! 🎉**

---

## Files I Created for Deployment

✅ **DEPLOY_RAILWAY_SIMPLE.md** - Step-by-step Railway guide (READ THIS FIRST)
✅ **DEPLOYMENT.md** - All deployment options compared
✅ **Procfile** - For Heroku/Railway
✅ **railway.json** - Railway configuration
✅ **Dockerfile** - For Docker/AWS/GCP
✅ **docker-compose.yml** - Local Docker setup
✅ **runtime.txt** - Python version
✅ **deploy_railway.sh** - Automated deployment script

---

## Platform Recommendations

| Your Need | Platform | Why |
|-----------|----------|-----|
| **Easiest & Free** | Railway | Auto-config, PostgreSQL included, 500hr free |
| **Side Project** | Render | Good free tier, easy setup |
| **Learning** | Heroku | Established, lots of tutorials |
| **Scaling Later** | DigitalOcean | Balance of ease and control |
| **Enterprise** | AWS/GCP | Full control, advanced features |

---

## What Happens When You Deploy?

1. **Platform detects Python** from `requirements.txt`
2. **Installs dependencies** automatically
3. **Runs your app** using `Procfile` or auto-detect
4. **Provides URL** like `your-app.railway.app`
5. **Enables HTTPS** automatically
6. **Monitors** your app health

---

## After Deployment

### Import Your Wrestler Data
Either:
- Use Railway CLI: `railway run python import_csv.py wrestlers_sample.csv`
- Or add auto-import to `app/main.py` startup event (see DEPLOY_RAILWAY_SIMPLE.md)

### Share Your API
Users can:
1. Sign up: `POST https://YOUR-URL/api/v1/signup?email=user@example.com`
2. Get API key in response
3. Query rankings: `GET https://YOUR-URL/api/v1/rankings` with `x-api-key` header

### Monitor Usage
- Railway/Render/Heroku dashboards show:
  - Request counts
  - Response times
  - Errors
  - Resource usage

---

## Updating Your API

```bash
# Make changes locally
git add .
git commit -m "Update rankings"
git push

# Platform auto-deploys!
```

---

## Cost Estimate

**Starting out (0-100 users):**
- Railway: $0-5/month
- You can start completely free!

**Growing (100-1000 users):**
- $5-20/month depending on platform

**Scaling (1000+ users):**
- $20-100/month with database and multiple instances

---

## Need Help?

1. **Read**: `DEPLOY_RAILWAY_SIMPLE.md` (easiest method)
2. **Compare**: `DEPLOYMENT.md` (all options)
3. **Automate**: Run `./deploy_railway.sh` (requires Railway CLI)

---

## Summary

**You have everything needed to deploy! Here's what to do:**

1. ✅ Push code to GitHub
2. ✅ Deploy to Railway (5 minutes)
3. ✅ Add PostgreSQL database
4. ✅ Import wrestler data
5. ✅ Share your URL!

**Start with Railway - it's the easiest!**

Read `DEPLOY_RAILWAY_SIMPLE.md` for detailed instructions.
