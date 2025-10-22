# Wrestling API

A FastAPI-based REST API for NCAA Division I wrestling rankings with authentication, rate limiting, and subscription plans.

## Features

- 🔐 API key authentication
- 📊 NCAA Division I wrestler rankings by weight class
- 🎯 Rate limiting (500 requests/month for free tier)
- 💳 Stripe integration ready for paid plans
- 📝 CSV import system for easy data management
- 🔍 Filter rankings by weight class

## Quick Start

### Local Development (2 minutes)

```bash
# One-command setup
./setup.sh

# Start the server
uvicorn app.main:app --reload
```

Your API is now running at `http://127.0.0.1:8000`

**See `RUN_LOCALLY.md` for detailed local development guide.**

---

### Full Setup (Manual)

### 1. Installation

```bash
# Clone or navigate to project
cd wrestling-api

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

Create a `.env` file:

```env
# Database
DATABASE_URL=sqlite:///./wrestling_api.db

# Stripe (add your keys when ready)
STRIPE_API_KEY=your_stripe_api_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

### 3. Initialize Database

```bash
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 4. Import Wrestler Data

```bash
# Create CSV template
python import_csv.py create

# Edit wrestlers_sample.csv with your data, then:
python import_csv.py wrestlers_sample.csv
```

### 5. Start Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`

## API Usage

### Get API Key

Sign up to get an API key:

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/signup?email=your@email.com"
```

Response:
```json
{
  "email": "your@email.com",
  "api_key": "your-api-key-here",
  "plan": "free"
}
```

### Get Rankings

```bash
# All wrestlers
curl -H "x-api-key: YOUR_API_KEY" http://127.0.0.1:8000/api/v1/rankings

# Filter by weight class
curl -H "x-api-key: YOUR_API_KEY" http://127.0.0.1:8000/api/v1/rankings?weight_class=157
```

### Interactive Documentation

Visit `http://127.0.0.1:8000/docs` for interactive API documentation (Swagger UI)

## Data Management

### CSV Import (Recommended)

The CSV format:
```csv
rank,name,school,weight_class,source
1,Spencer Lee,Iowa,125,FloWrestling
2,Patrick Glory,Princeton,125,FloWrestling
```

Import command:
```bash
python import_csv.py your_rankings.csv
```

### Update Data Regularly

```bash
# 1. Update your CSV file with latest rankings
# 2. Import the updated file
python import_csv.py updated_rankings.csv
```

### Web Scraping

Basic scraper included (limited due to JS-heavy ranking sites):

```bash
python run_scraper.py
```

See `SCRAPER_GUIDE.md` for details on scraping challenges and alternatives.

## Project Structure

```
wrestling-api/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── database.py          # Database setup
│   ├── dependencies.py      # Auth & rate limiting
│   ├── models.py            # Database models
│   ├── routers/
│   │   ├── rankings.py      # Rankings endpoints
│   │   └── user.py          # User/signup endpoints
│   └── scrappers/
│       └── ncaa.py          # Web scraping (optional)
├── import_csv.py            # CSV import tool
├── run_scraper.py           # Scraper runner
├── requirements.txt         # Dependencies
├── .env                     # Configuration (create this)
├── wrestling_api.db         # SQLite database (auto-created)
└── SCRAPER_GUIDE.md         # Scraping documentation
```

## API Endpoints

### Public Endpoints
- `GET /` - Welcome message
- `POST /api/v1/signup` - Get API key

### Authenticated Endpoints (require x-api-key header)
- `GET /api/v1/rankings` - Get all wrestler rankings
- `GET /api/v1/rankings?weight_class={weight}` - Filter by weight class

## Rate Limiting

- **Free tier**: 500 requests per month
- **Pro tier**: Unlimited (Stripe integration required)

## Database Schema

### Users
- id, email, api_key, plan (free/pro)

### Wrestlers
- id, name, school, weight_class, rank, source, last_updated

### APIUsage
- id, user_id, date, requests

## Production Deployment

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname  # For PostgreSQL
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Run with Gunicorn

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Docker (Optional)

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Data Sources

Rankings can be sourced from:
- FloWrestling: https://www.flowrestling.org/rankings
- InterMat: https://intermatwrestle.com/rankings
- WIN Magazine: https://www.amateurwrestlingnews.com/
- TrackWrestling: https://www.trackwrestling.com/

**Note**: Most sites require manual data collection. See `SCRAPER_GUIDE.md` for details.

## Maintenance

### Backup Database

```bash
# SQLite
cp wrestling_api.db backup_$(date +%Y%m%d).db

# PostgreSQL
pg_dump dbname > backup_$(date +%Y%m%d).sql
```

### Update Rankings Weekly

```bash
# 1. Export/update CSV from ranking sources
# 2. Import to database
python import_csv.py weekly_rankings.csv
```

## Troubleshooting

### "Invalid API key"
- Sign up first: `POST /api/v1/signup?email=your@email.com`
- Include header: `x-api-key: YOUR_KEY`

### "Free tier limit reached"
- Wait until next month, or
- Upgrade to pro tier (implement Stripe)

### Empty rankings
- Import data: `python import_csv.py wrestlers_sample.csv`

## License

[Your License Here]

## Support

For issues or questions, see `SCRAPER_GUIDE.md` or open an issue.
