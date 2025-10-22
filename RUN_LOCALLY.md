# 🏠 Run Your API Locally

## Quick Start (2 minutes)

### First Time Setup
```bash
# 1. Setup everything (one command!)
./setup.sh

# 2. Start the server
uvicorn app.main:app --reload
```

That's it! Your API is running at **http://127.0.0.1:8000**

---

## Manual Setup (if you prefer step-by-step)

### 1. Create Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Create Configuration
Create a `.env` file:
```bash
cat > .env << EOF
DATABASE_URL=sqlite:///./wrestling_api.db
STRIPE_API_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
EOF
```

### 4. Initialize Database
```bash
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 5. Import Sample Data
```bash
# Create sample CSV
python import_csv.py create

# Import it
python import_csv.py wrestlers_sample.csv
```

### 6. Start Server
```bash
uvicorn app.main:app --reload
```

---

## Access Your API

### API Endpoints
- **Welcome**: http://127.0.0.1:8000/
- **Interactive Docs**: http://127.0.0.1:8000/docs
- **Alternative Docs**: http://127.0.0.1:8000/redoc

### Test It Out

#### 1. Visit the docs
Open in browser: http://127.0.0.1:8000/docs

#### 2. Sign up for an API key
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/signup?email=test@example.com"
```

Response:
```json
{
  "email": "test@example.com",
  "api_key": "abc123-your-api-key-here",
  "plan": "free"
}
```

#### 3. Get rankings
```bash
# Use the API key from step 2
curl -H "x-api-key: YOUR_API_KEY" http://127.0.0.1:8000/api/v1/rankings
```

#### 4. Filter by weight class
```bash
curl -H "x-api-key: YOUR_API_KEY" "http://127.0.0.1:8000/api/v1/rankings?weight_class=141"
```

---

## Common Commands

### Start/Stop Server
```bash
# Start with auto-reload (development)
uvicorn app.main:app --reload

# Start on different port
uvicorn app.main:app --port 8080 --reload

# Stop server
Ctrl + C
```

### Manage Data
```bash
# Import new rankings
python import_csv.py updated_rankings.csv

# Create sample data
python import_csv.py create
```

### Database Operations
```bash
# View data in SQLite
sqlite3 wrestling_api.db "SELECT * FROM wrestlers LIMIT 5;"

# Count records
sqlite3 wrestling_api.db "SELECT COUNT(*) FROM wrestlers;"

# Backup database
cp wrestling_api.db backup_$(date +%Y%m%d).db
```

---

## Development Workflow

### 1. Make Changes
Edit files in `app/` directory

### 2. Server Auto-Reloads
With `--reload` flag, changes are detected automatically

### 3. Test Changes
Visit http://127.0.0.1:8000/docs to test

### 4. Update Data
```bash
python import_csv.py new_rankings.csv
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn app.main:app --port 8080 --reload
```

### Module Not Found
```bash
# Make sure virtual environment is activated
source .venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Database Locked
```bash
# Close any open database connections
# Restart the server
```

### "Invalid API Key"
```bash
# Sign up first
curl -X POST "http://127.0.0.1:8000/api/v1/signup?email=test@example.com"

# Use the API key from the response
```

---

## Project Structure (Local)

```
wrestling-api/
├── app/
│   ├── main.py              # FastAPI app - start here
│   ├── models.py            # Database models
│   ├── database.py          # Database connection
│   ├── dependencies.py      # Auth & rate limiting
│   ├── routers/
│   │   ├── rankings.py      # /api/v1/rankings
│   │   └── user.py          # /api/v1/signup
│   └── scrappers/
│       └── ncaa.py          # Web scraping (optional)
├── .env                     # Your config (create this)
├── .venv/                   # Virtual environment
├── wrestling_api.db         # SQLite database
├── import_csv.py            # Import data tool
└── wrestlers_sample.csv     # Sample data
```

---

## Using Docker (Alternative)

### With Docker Compose
```bash
# Start everything (API + PostgreSQL)
docker-compose up

# Your API: http://localhost:8000
# Stop: Ctrl+C or `docker-compose down`
```

### Just the API
```bash
# Build
docker build -t wrestling-api .

# Run
docker run -p 8000:8000 \
  -e DATABASE_URL=sqlite:///./wrestling_api.db \
  wrestling-api
```

---

## Environment Variables

Create `.env` file with:

```env
# Database (local SQLite)
DATABASE_URL=sqlite:///./wrestling_api.db

# Or PostgreSQL (for production-like setup)
# DATABASE_URL=postgresql://user:pass@localhost:5432/wrestling_api

# Stripe (get from https://stripe.com)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Change rate limits
FREE_TIER_LIMIT=500
```

---

## Tips for Local Development

### 1. Use Auto-Reload
```bash
uvicorn app.main:app --reload
```
Changes to Python files trigger automatic restart

### 2. Check Logs
Server logs appear in terminal - watch for errors

### 3. Interactive Testing
Use the docs UI at `/docs` - easier than curl

### 4. Sample Data
Keep `wrestlers_sample.csv` for quick resets:
```bash
python import_csv.py wrestlers_sample.csv
```

### 5. Database Browser
View data with:
```bash
sqlite3 wrestling_api.db
.tables
.schema wrestlers
SELECT * FROM wrestlers;
```

---

## Next Steps

### Local Development → Production

1. **Test locally** with `uvicorn app.main:app --reload`
2. **Push to GitHub**
3. **Deploy to Railway** (see `DEPLOY_NOW.md`)
4. **Your API is live!**

---

## Summary

**To start working locally:**

```bash
# One-time setup
./setup.sh

# Every time you work
source .venv/bin/activate
uvicorn app.main:app --reload
```

**Then visit:** http://127.0.0.1:8000/docs

That's it! 🎉
