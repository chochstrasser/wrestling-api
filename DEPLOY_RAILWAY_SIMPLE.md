# Deploy to Railway (No CLI - Easiest Method)

## 5-Minute Deployment Guide

### Step 1: Push to GitHub (2 minutes)

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub.com, then:
git remote add origin https://github.com/YOUR-USERNAME/wrestling-api.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway (2 minutes)

1. Go to **https://railway.app**
2. Click **"Login with GitHub"**
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose **"wrestling-api"** repository
6. Railway automatically:
   - Detects Python
   - Installs dependencies
   - Starts your API
   - Gives you a URL

### Step 3: Add Database (1 minute)

1. In your Railway project dashboard
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway automatically sets `DATABASE_URL` environment variable

### Step 4: Add Environment Variables (30 seconds)

1. Click on your **web service** (not database)
2. Click **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these (click "Add" after each):
   ```
   STRIPE_API_KEY = sk_test_YOUR_KEY
   STRIPE_WEBHOOK_SECRET = whsec_YOUR_SECRET
   ```

### Step 5: Get Your Public URL (30 seconds)

1. Click **"Settings"** tab in your web service
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. Your API is now live at: `https://wrestling-api-production.up.railway.app`

### Step 6: Import Data (2 minutes)

**Option A: Railway CLI** (if you have Node.js)
```bash
npm install -g @railway/cli
railway login
railway link
railway run python import_csv.py wrestlers_sample.csv
```

**Option B: Temporarily add to startup** (easier)
Add this to your `app/main.py` temporarily:
```python
@app.on_event("startup")
async def startup_event():
    from app.database import SessionLocal
    from app.models import Wrestler
    db = SessionLocal()
    if db.query(Wrestler).count() == 0:
        # Import sample data on first run
        import csv
        with open('wrestlers_sample.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                wrestler = Wrestler(
                    rank=int(row['rank']),
                    name=row['name'],
                    school=row['school'],
                    weight_class=row['weight_class'],
                    source=row.get('source', 'CSV')
                )
                db.add(wrestler)
        db.commit()
    db.close()
```

Then push to GitHub - Railway auto-deploys and imports data!

---

## Test Your API

```bash
# Get the welcome message
curl https://YOUR-APP.railway.app/

# Sign up for an API key
curl -X POST "https://YOUR-APP.railway.app/api/v1/signup?email=test@example.com"

# Get rankings (use the API key from signup)
curl -H "x-api-key: YOUR-API-KEY" https://YOUR-APP.railway.app/api/v1/rankings
```

---

## Your API is Live! 🎉

Share with users:
- **API URL**: `https://YOUR-APP.railway.app`
- **Docs**: `https://YOUR-APP.railway.app/docs`
- **Signup**: `POST /api/v1/signup?email=user@example.com`
- **Rankings**: `GET /api/v1/rankings` (requires API key)

---

## Monitoring

Railway Dashboard shows:
- 📊 **Metrics** - CPU, Memory, Response times
- 📝 **Logs** - Real-time application logs
- 🔔 **Alerts** - Get notified of issues
- 💰 **Usage** - Track costs

---

## Updating Rankings

### Method 1: Push to GitHub
```bash
# Update wrestlers_sample.csv locally
python import_csv.py updated_rankings.csv

# Commit and push
git add wrestling_api.db
git commit -m "Update rankings"
git push

# Railway auto-deploys
```

### Method 2: Railway CLI
```bash
railway run python import_csv.py new_rankings.csv
```

---

## Cost

- **Free tier**: 500 hours/month (~$0)
- **Hobby plan**: $5/month unlimited
- **Database**: Included in hobby plan

Perfect for side projects and MVPs!

---

## Troubleshooting

### "Application failed to start"
Check Railway logs for errors. Common issues:
- Missing environment variables
- Database not connected
- Port binding (use `$PORT` variable)

### "Database connection error"
Make sure PostgreSQL is added and `DATABASE_URL` is set

### Need Help?
- Railway docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

---

## Done! ✅

Your Wrestling API is now live and accessible to anyone on the internet!
