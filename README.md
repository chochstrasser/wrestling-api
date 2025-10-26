# Wrestling API (Node.js/Express)

A Node.js Express REST API for NCAA Division I wrestling rankings with authentication, rate limiting, and subscription plans.

## Features

- 🔐 API key authentication
- 📊 NCAA Division I wrestler rankings by weight class
- 🎯 Rate limiting (500 requests/month for free tier)
- 💳 Stripe integration ready for paid plans
- 📝 CSV import system for easy data management
- 🔍 Filter rankings by weight class
- 🌐 Web scraping support (Cheerio + Playwright)

## Quick Start

### Installation

```bash
# Install dependencies (using yarn as per your preference)
yarn install

# Or with npm
npm install
```

### Configuration

Create a `.env` file:

```env
# Database (defaults to SQLite if not specified)
DATABASE_URL=sqlite:wrestling_api.db

# Stripe (optional - add when ready)
STRIPE_API_KEY=your_stripe_api_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Server
PORT=8000
NODE_ENV=development
```

### Start Server

```bash
# Development mode (with auto-reload)
yarn dev

# Production mode
yarn start
```

The API will be available at `http://localhost:8000`

## API Usage

### Get API Key

Sign up to get an API key:

```bash
curl -X POST "http://localhost:8000/api/v1/signup?email=your@email.com"
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
curl -H "x-api-key: YOUR_API_KEY" http://localhost:8000/api/v1/rankings

# Filter by weight class
curl -H "x-api-key: YOUR_API_KEY" http://localhost:8000/api/v1/rankings?weight_class=157
```

### Get User Info

```bash
curl "http://localhost:8000/api/v1/user?email=your@email.com"
```

### Delete User

```bash
curl -X DELETE "http://localhost:8000/api/v1/user?email=your@email.com"
```

## Data Management

### CSV Import (Recommended)

Create a sample CSV:

```bash
node scripts/importCsv.js create
```

This creates `wrestlers_sample.csv` with the format:

```csv
rank,name,school,weight_class,source
1,Spencer Lee,Iowa,125,FloWrestling
2,Patrick Glory,Princeton,125,FloWrestling
```

Import your CSV:

```bash
node scripts/importCsv.js wrestlers.csv
```

### Web Scraping

#### Option 1: Via API Endpoint (Recommended for Production)

This is the best option for Railway and other cloud deployments:

```bash
# Trigger scraper (uses Playwright by default)
curl -X POST \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"usePlaywright": true, "clearExisting": true}' \
  https://your-app.railway.app/api/v1/scraper/run

# Check scraper status
curl -H "x-api-key: YOUR_API_KEY" \
  https://your-app.railway.app/api/v1/scraper/status
```

Request body options:
- `usePlaywright` (boolean, default: true) - Use Playwright for JS-rendered sites
- `clearExisting` (boolean, default: true) - Clear existing data before importing

#### Option 2: Command Line Scripts (Local Development)

Basic scraper (using Cheerio):

```bash
yarn scrape
# or
node scripts/runScraper.js
```

Playwright scraper (for JavaScript-rendered sites):

```bash
# First, install Playwright browsers
npx playwright install chromium

# Run Playwright scraper
node scripts/runScraper.js --playwright
# or
node scripts/runScraper.js -p
```

Test scraper without saving to database:

```bash
node scripts/testScraper.js
node scripts/testScraper.js --playwright
```

## Project Structure

```
wrestling-api/
├── src/
│   ├── index.js              # Express application entry
│   ├── config.js             # Configuration
│   ├── database.js           # Sequelize setup
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── Wrestler.js       # Wrestler model
│   │   └── APIUsage.js       # API usage tracking
│   ├── middleware/
│   │   └── auth.js           # Authentication & rate limiting
│   ├── routes/
│   │   ├── rankings.js       # Rankings endpoints
│   │   ├── user.js           # User/signup endpoints
│   │   └── scraper.js        # Scraper trigger endpoints
│   └── scrapers/
│       ├── ncaa.js           # Basic scraper (Cheerio)
│       └── playwright.js     # Playwright scraper
├── scripts/
│   ├── importCsv.js          # CSV import utility
│   ├── runScraper.js         # Scraper runner
│   └── testScraper.js        # Test scraper
├── package.json              # Dependencies and scripts
├── .env                      # Configuration (create this)
├── wrestling_api.db          # SQLite database (auto-created)
├── Dockerfile                # Docker configuration
├── docker-compose.yml        # Docker Compose setup
└── Procfile                  # Heroku/Railway deployment
```

## API Endpoints

### Public Endpoints

- `GET /` - Welcome message
- `POST /api/v1/signup?email={email}` - Get API key
- `GET /api/v1/user?email={email}` - Get user info
- `DELETE /api/v1/user?email={email}` - Delete user account

### Authenticated Endpoints (require x-api-key header)

- `GET /api/v1/rankings` - Get all wrestler rankings
- `GET /api/v1/rankings?weight_class={weight}` - Filter by weight class
- `POST /api/v1/scraper/run` - Trigger scraper to populate database
- `GET /api/v1/scraper/status` - Check database status and scraper health

## Rate Limiting

- **Free tier**: 500 requests per month
- **Pro/Business tier**: Unlimited (set in user.plan field)

Rate limits are tracked monthly per user in the APIUsage table.

## Database

### Default: SQLite

By default, the API uses SQLite for easy local development. The database file is `wrestling_api.db`.

### PostgreSQL (Production)

For production, set the DATABASE_URL environment variable:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Database Schema

**Users**

- id, email (unique), api_key (unique), plan (free/pro/business)

**Wrestlers**

- id, name, school, weight_class, rank, source, last_updated

**APIUsage**

- id, user_id (FK), date, requests (count)

## Production Deployment

### Docker

Build and run:

```bash
docker build -t wrestling-api .
docker run -p 8000:8000 --env-file .env wrestling-api
```

Or use Docker Compose:

```bash
docker-compose up
```

This starts both the API and PostgreSQL database.

### Heroku/Railway

The project includes a `Procfile` for easy deployment to Heroku or Railway:

```
web: node src/index.js
```

Set environment variables in your platform's dashboard:

- `DATABASE_URL` (PostgreSQL connection string)
- `STRIPE_API_KEY` (optional)
- `STRIPE_WEBHOOK_SECRET` (optional)
- `PORT` (automatically set by platform)

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PORT=8000
NODE_ENV=production
```

## Weight Classes

NCAA Division I weight classes:

- 125, 133, 141, 149, 157, 165, 174, 184, 197, 285 lbs

## Data Sources

Rankings can be sourced from:

- FloWrestling: https://www.flowrestling.org/rankings
- NCAA.com: https://www.ncaa.com/rankings/wrestling/d1
- Manual CSV import (recommended for accuracy)

**Note**: Most wrestling ranking sites use JavaScript rendering. The Playwright scraper is recommended for automated data collection.

## Scripts

Available npm/yarn scripts:

```bash
yarn start         # Start production server
yarn dev           # Start development server with nodemon
yarn scrape        # Run basic scraper
yarn import        # Run CSV import utility
yarn test          # Test scraper without saving
```

## Troubleshooting

### "Invalid API key"

- Sign up first: `POST /api/v1/signup?email=your@email.com`
- Include header: `x-api-key: YOUR_KEY`

### "Free tier limit reached"

- Wait until next month (usage resets monthly)
- Or manually update user plan in database to 'pro'

### Empty rankings

- Import data: `node scripts/importCsv.js wrestlers_sample.csv`
- Or run scraper: `yarn scrape`

### Scraper finds no data

- Try Playwright scraper: `node scripts/runScraper.js --playwright`
- Or use CSV import method (most reliable)

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
