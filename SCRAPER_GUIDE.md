# Wrestling API - Data Collection Guide

## Overview
NCAA wrestling ranking websites use heavy JavaScript rendering and/or require authentication, making automated scraping challenging. This guide provides multiple practical approaches to get data into your API.

## ⚡ Quick Start Options (Easiest First)

### 1. Use Sample Data (Fastest - 5 seconds)
```bash
python add_sample_data.py
```
✅ Works immediately  
✅ No external dependencies  
❌ Not real/current data  

### 2. Import from CSV (Recommended - 1 minute)
```bash
# Create a sample CSV template
python import_csv.py create

# Edit wrestlers_sample.csv with real data, then:
python import_csv.py wrestlers_sample.csv
```
✅ Easy to maintain  
✅ Can copy/paste from any source  
✅ Version controllable  
❌ Requires manual updates  

### 3. Web Scraping (Advanced - Complex)
```bash
python run_scraper.py
```
✅ Automated updates  
❌ Requires dealing with JS rendering  
❌ Sites may block scrapers  
❌ Breaks when sites change  

## Detailed Instructions

### Option 1: Sample Data
Perfect for development and testing:
```bash
python add_sample_data.py
```
This adds 10 sample wrestlers across different weight classes.

### Option 2: CSV Import (RECOMMENDED)

#### Step 1: Create CSV Template
```bash
python import_csv.py create
```

This creates `wrestlers_sample.csv` with this format:
```csv
rank,name,school,weight_class,source
1,Spencer Lee,Iowa,125,Manual
2,Patrick Glory,Princeton,125,Manual
```

#### Step 2: Get Real Data
You can manually copy/paste from:
- FloWrestling: https://www.flowrestling.org/rankings
- InterMat: https://intermatwrestle.com/rankings
- WIN Magazine: https://www.amateurwrestlingnews.com/
- TrackWrestling: https://www.trackwrestling.com/

Or export from Excel/Google Sheets in CSV format.

#### Step 3: Import
```bash
python import_csv.py wrestlers_sample.csv
```

### Option 3: Web Scraping

#### Current Status
Most wrestling sites use JavaScript rendering, making them difficult to scrape:
- ❌ FloWrestling - Requires authentication, JS-heavy
- ❌ NCAA.com - 404 on ranking pages
- ❌ InterMat - Timeout/authentication issues
- ❌ TrackWrestling - Heavy JavaScript

#### If You Want to Try Anyway

##### Using the Basic Scraper
```bash
python run_scraper.py
```

##### Using Playwright (for JS sites)
1. Install Playwright:
```bash
pip install playwright
playwright install chromium
```

2. Edit `run_scraper.py` and uncomment:
```python
from app.scrappers.ncaa import PlaywrightScraper as NCAAScraper
```

3. Run:
```bash
python run_scraper.py
```

**Note**: Even with Playwright, many sites require login or have anti-scraping measures.

## Best Practices

### For Production Use

1. **Start with CSV imports** - Most reliable
2. **Schedule manual updates** - Weekly/monthly
3. **Use multiple sources** - Cross-reference rankings
4. **Version control your CSVs** - Track changes over time

### If You Need Automation

Consider these approaches:
1. **Official APIs** - Contact ranking providers for API access
2. **RSS/Email alerts** - Parse update notifications
3. **Paid data services** - Sports data aggregators
4. **Manual entry API** - Build an admin interface for data entry

### Setting Up Manual Updates

Create a weekly task:
```bash
# 1. Download/copy current rankings to CSV
# 2. Run import
python import_csv.py current_rankings.csv

# 3. Verify via API
curl -H "x-api-key: YOUR_KEY" http://localhost:8000/api/v1/rankings
```

## Alternative Data Sources

### 1. Official NCAA Stats API
Check if NCAA provides official APIs:
- https://www.ncaa.com/stats/wrestling/d1

### 2. Contact Ranking Providers
Email these providers about API access:
- FloWrestling: support@flowrestling.org
- InterMat: contact@intermatwrestle.com
- WIN Magazine: editors@win-magazine.com

### 3. Build a Submission System
Allow users to submit rankings (with moderation):
```python
@router.post("/submit-ranking")
def submit_ranking(name: str, school: str, weight: str, ...):
    # Add to pending_rankings table
    # Admin reviews and approves
```

## Troubleshooting

### "All ranking sources failed"
**Solution**: This is expected. Use CSV import or sample data.

### "Playwright timeout"
**Solution**: Site structure changed or requires login. Switch to CSV import.

### "ImportError: No module named 'playwright'"
**Solution**:
```bash
pip install playwright
playwright install chromium
```

### "CSV file not found"
**Solution**: Create it first:
```bash
python import_csv.py create
```

## Maintaining Your Data

### Weekly Update Workflow
1. Visit ranking sites manually
2. Copy data to Excel/Google Sheets
3. Export as CSV
4. Run: `python import_csv.py weekly_update.csv`

### Tracking Changes
```bash
# Keep historical CSVs
mv current_rankings.csv rankings_2025_10_21.csv
cp new_rankings.csv current_rankings.csv
python import_csv.py current_rankings.csv
```

### Backup Database
```bash
# SQLite backup
cp wrestling_api.db wrestling_api_backup_$(date +%Y%m%d).db
```

## Summary

**For Development**: Use `add_sample_data.py`  
**For Production**: Use CSV imports with manual updates  
**For Automation**: Contact ranking providers for official API access  

The CSV import approach is the most reliable and maintainable solution for most use cases.
