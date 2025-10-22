# Production Deployment Guide

This guide covers deploying your Wrestling API to production so others can use it.

## Quick Deployment Options

### 1. Railway (Easiest - Recommended for Beginners)
**Cost**: Free tier available, then ~$5/month  
**Time**: 5 minutes  
**Best for**: Quick deployment, automatic HTTPS

#### Steps:
1. Sign up at https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select your repo
4. Railway auto-detects Python and deploys
5. Add environment variables in Railway dashboard:
   - `DATABASE_URL` (Railway provides PostgreSQL)
   - `STRIPE_API_KEY`
   - `STRIPE_WEBHOOK_SECRET`

**That's it!** Railway gives you a URL like `your-app.railway.app`

---

### 2. Render (Very Easy)
**Cost**: Free tier available, then $7/month  
**Time**: 10 minutes  
**Best for**: Free tier, good for side projects

#### Steps:
1. Sign up at https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repo
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Click "Create Web Service"

---

### 3. Heroku (Popular)
**Cost**: ~$5-7/month (no free tier anymore)  
**Time**: 15 minutes  
**Best for**: Established platform, lots of add-ons

#### Steps:
1. Install Heroku CLI: `brew install heroku/brew/heroku`
2. Login: `heroku login`
3. Create app: `heroku create your-wrestling-api`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql:mini`
5. Set environment variables:
   ```bash
   heroku config:set STRIPE_API_KEY=your_key
   heroku config:set STRIPE_WEBHOOK_SECRET=your_secret
   ```
6. Deploy: `git push heroku main`

**Required files** (I'll create these below):
- `Procfile` - Tells Heroku how to run your app
- `runtime.txt` - Python version

---

### 4. DigitalOcean App Platform
**Cost**: $5/month  
**Time**: 10 minutes  
**Best for**: Balance of simplicity and control

#### Steps:
1. Sign up at https://www.digitalocean.com
2. Go to Apps → Create App
3. Connect GitHub
4. DigitalOcean auto-detects and configures
5. Add environment variables
6. Deploy

---

### 5. AWS / Google Cloud / Azure (Advanced)
**Cost**: Variable (~$10-50/month)  
**Time**: 1-2 hours  
**Best for**: Enterprise, need full control

These require more setup but offer more flexibility. Use Docker for easier deployment.

---

## Required Configuration Files

I'll create these files for you to enable deployment on any platform.

## Cost Comparison

| Platform | Free Tier | Paid Tier | Database | HTTPS |
|----------|-----------|-----------|----------|-------|
| Railway | 500 hrs/month | $5/month | PostgreSQL included | ✅ Auto |
| Render | ✅ (limited) | $7/month | PostgreSQL extra | ✅ Auto |
| Heroku | ❌ | $7/month | PostgreSQL $5/month | ✅ Auto |
| DigitalOcean | ❌ | $5/month | Managed DB extra | ✅ Auto |
| Fly.io | 3 VMs free | $5/month | PostgreSQL free | ✅ Auto |

## My Recommendation

**For your first deployment: Railway**
- Easiest setup
- Free tier to start
- Automatic HTTPS
- PostgreSQL included
- Great for MVPs

**For scaling later: DigitalOcean or AWS**

---

## Step-by-Step: Deploy to Railway (Detailed)

### Prerequisites
1. Create a GitHub account (if you don't have one)
2. Push your code to GitHub

### Deploy
1. Go to https://railway.app and sign up with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `wrestling-api` repository
5. Railway will:
   - Detect Python
   - Install dependencies from `requirements.txt`
   - Start your app

### Add Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway auto-creates `DATABASE_URL` environment variable

### Configure Environment Variables
1. Click on your web service
2. Go to "Variables" tab
3. Add:
   ```
   STRIPE_API_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Import Initial Data
You'll need to run the CSV import once. Two options:

**Option A: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run import
railway run python import_csv.py wrestlers_sample.csv
```

**Option B: Add an Admin Endpoint**
Create an admin endpoint to upload CSV (I can add this for you)

### Get Your URL
Railway provides a URL like: `https://wrestling-api-production.up.railway.app`

Share this URL with users!

---

## Post-Deployment Checklist

- [ ] Database is PostgreSQL (not SQLite) for production
- [ ] Environment variables are set
- [ ] Initial wrestler data is imported
- [ ] API docs accessible at `/docs`
- [ ] Test signup endpoint works
- [ ] Test rankings endpoint with API key
- [ ] Set up monitoring (Railway/Render provide this)
- [ ] Configure custom domain (optional)

---

## Security for Production

1. **Use PostgreSQL**, not SQLite
2. **Use real Stripe keys** (not test keys) when ready
3. **Add rate limiting** (already implemented ✅)
4. **Enable CORS** if you have a frontend:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   app.add_middleware(CORSMiddleware, allow_origins=["*"])
   ```
5. **Use HTTPS** (automatic on Railway/Render/Heroku)

---

## Updating Data in Production

### Option 1: Local Script + Deploy
```bash
# Update CSV locally
python import_csv.py new_rankings.csv

# Commit database
git add wrestling_api.db
git commit -m "Update rankings"
git push

# Railway auto-deploys
```

### Option 2: Remote Script
```bash
# Use Railway CLI
railway run python import_csv.py updated_rankings.csv
```

### Option 3: Admin API Endpoint
Add a protected endpoint for uploading CSV files (I can implement this)

---

## Monitoring & Maintenance

All platforms provide:
- **Logs** - View errors and requests
- **Metrics** - CPU, memory, response times
- **Alerts** - Get notified of issues

### Railway Example:
- Click "Observability" tab
- View real-time logs
- Monitor resource usage

---

## Scaling

When you get more users:

1. **Upgrade database**: More storage and connections
2. **Add caching**: Redis for frequently accessed data
3. **CDN**: CloudFlare for static content
4. **Load balancing**: Multiple instances (Railway/Heroku do this)

---

## Cost Estimates by Usage

| Users | Requests/month | Platform | Cost |
|-------|---------------|----------|------|
| 10-50 | <50k | Railway Free | $0 |
| 100-500 | 100k-500k | Railway Hobby | $5/month |
| 1k-5k | 1M+ | Railway Pro | $20/month |
| 5k+ | 5M+ | DigitalOcean/AWS | $50-200/month |

---

## Next Steps

1. Choose a platform (I recommend Railway)
2. I'll create the deployment files for you
3. Push to GitHub
4. Deploy to Railway
5. Import your wrestler data
6. Share the API URL!

**Want me to create the deployment files for Railway/Heroku now?**
