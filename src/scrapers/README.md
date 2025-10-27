# Wrestling Data Scrapers

Organized scraper system for collecting wrestling rankings from multiple sources.

## Structure

```
src/scrapers/
├── base/
│   └── BaseScraper.js          # Common scraping utilities
├── sources/
│   ├── FlowWrestlingScraper.js # FloWrestling rankings
│   └── NCAAOfficialScraper.js  # NCAA.com official rankings
├── config/
│   └── rankings.js             # URL configurations and editions
├── index.js                    # Main exports and factory functions
├── ncaa.js                     # Legacy scraper (backward compatibility)
└── playwright.js               # Legacy Playwright scraper
```

## Quick Start

### Using the Factory Function

```javascript
import { createScraper } from './scrapers/index.js';

// Create a FlowWrestling scraper
const scraper = createScraper('flowrestling');
const rankings = await scraper.fetchRankings();

// With Playwright for JS-rendered pages
const playwrightScraper = createScraper('flowrestling', {
  usePlaywright: true
});

// Specific edition
const oldRankings = createScraper('flowrestling', {
  edition: 'edition-54317'
});

// Don't forget to close Playwright scrapers
await scraper.close();
```

### Using Scrapers Directly

```javascript
import { FlowWrestlingScraper, NCAAOfficialScraper } from './scrapers/index.js';

// FlowWrestling
const flowScraper = new FlowWrestlingScraper({
  edition: 'current',
  usePlaywright: false
});
const flowRankings = await flowScraper.fetchRankings();

// NCAA Official
const ncaaScraper = new NCAAOfficialScraper();
const ncaaRankings = await ncaaScraper.fetchRankings();
```

### Get Rankings by Weight Class

```javascript
import { getRankingsByWeight } from './scrapers/index.js';

// Get 125lbs rankings from all sources
const rankings125 = await getRankingsByWeight('125');

// From specific sources
const rankings125Flow = await getRankingsByWeight('125', {
  sources: ['flowrestling']
});
```

## Configuration

### Adding New Ranking Editions

Edit [src/scrapers/config/rankings.js](src/scrapers/config/rankings.js):

```javascript
export const FLOWRESTLING_RANKINGS = {
  'my-new-edition': {
    name: 'Description of this edition',
    baseUrl: 'https://www.flowrestling.org/rankings/...',
    weightClasses: {
      '125': 'https://...',
      '133': 'https://...',
      // ... all weight classes
    }
  }
};
```

### Available Editions

List all available editions:

```javascript
import { getAvailableEditions } from './scrapers/index.js';

const editions = getAvailableEditions();
// [
//   { key: 'current', name: '2025-26 NCAA DI Wrestling Rankings (Current)' },
//   { key: 'edition-54317', name: '2025-26 NCAA DI Wrestling Rankings (Edition 54317)' }
// ]
```

Or via command line:

```bash
node scripts/testScraper.js --list-editions
```

## Adding New Data Sources

### 1. Create a New Scraper Class

Create a new file in [src/scrapers/sources/](src/scrapers/sources/):

```javascript
import { BaseScraper } from '../base/BaseScraper.js';

export class MyNewScraper extends BaseScraper {
  constructor(options = {}) {
    super(options);
    // Your initialization
  }

  async fetchRankings() {
    // Implement fetching logic
    const $ = await this.fetchStatic(url); // or fetchDynamic for Playwright
    const wrestlers = this._parseRankings($);
    return wrestlers;
  }

  async fetchRankingsByWeight(weightClass) {
    // Implement weight-specific logic
  }

  _parseRankings($) {
    const wrestlers = [];
    // Parse HTML and extract wrestler data
    wrestlers.push(this.normalizeWrestler({
      rank: 1,
      name: 'Wrestler Name',
      school: 'School Name',
      weight_class: '125',
      source: 'MySource'
    }));
    return wrestlers;
  }
}
```

### 2. Add Configuration

In [src/scrapers/config/rankings.js](src/scrapers/config/rankings.js):

```javascript
export const MYNEW_RANKINGS = {
  'current': {
    name: 'My New Source Rankings',
    url: 'https://example.com/rankings',
    weightClasses: { ... }
  }
};
```

### 3. Update Index

In [src/scrapers/index.js](src/scrapers/index.js):

```javascript
export { MyNewScraper } from './sources/MyNewScraper.js';

// Add to createScraper factory
case 'mynew':
  return new MyNewScraper(options);
```

## Command Line Tools

### Test Scraper (without database)

```bash
# Default: FlowWrestling current edition, static scraper
node scripts/testScraper.js

# With Playwright
node scripts/testScraper.js --playwright

# Specific source and edition
node scripts/testScraper.js --source flowrestling --edition edition-54317

# NCAA official
node scripts/testScraper.js --source ncaa

# List available editions
node scripts/testScraper.js --list-editions

# Help
node scripts/testScraper.js --help
```

### Run Scraper (populate database)

```bash
# Default: FlowWrestling current edition
node scripts/runScraper.js

# With Playwright
node scripts/runScraper.js --playwright

# Specific edition
node scripts/runScraper.js --edition edition-54317

# Different source
node scripts/runScraper.js --source ncaa

# Combined options
node scripts/runScraper.js --source flowrestling --edition edition-54317 --playwright

# Help
node scripts/runScraper.js --help
```

## API Usage

### Trigger Scraper via API

```bash
# Default settings
curl -X POST http://localhost:3000/api/v1/scraper/run \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"

# With options
curl -X POST http://localhost:3000/api/v1/scraper/run \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "usePlaywright": true,
    "source": "flowrestling",
    "edition": "edition-54317",
    "clearExisting": true
  }'
```

### Check Scraper Status

```bash
curl http://localhost:3000/api/v1/scraper/status \
  -H "X-API-Key: your-api-key"
```

Response includes:
- Database population status
- Total wrestlers
- Available weight classes
- Supported sources and editions

## Data Structure

All scrapers normalize wrestler data to this format:

```javascript
{
  rank: 1,                    // Integer rank
  name: "Wrestler Name",      // String
  school: "School Name",      // String
  weight_class: "125",        // String (weight in lbs)
  source: "FloWrestling",     // String (data source)
  grade: "SR",                // String (optional)
  previous_rank: "2",         // String (optional)
  record: "15-0"              // String (optional)
}
```

## Static vs Playwright Scrapers

### Static Scraper (Default)
- Faster
- Lower resource usage
- Works for server-side rendered pages
- No browser dependencies

### Playwright Scraper
- Handles JavaScript-rendered content
- Required for some modern websites
- Higher resource usage
- Requires Playwright installation

```bash
yarn add playwright
npx playwright install chromium
```

## Legacy Scrapers

For backward compatibility, the old scrapers are still available:

```javascript
import { NCAAScraper, PlaywrightScraper } from './scrapers/index.js';

// Or via factory
const legacyScraper = createScraper('ncaa-legacy');
const playwrightLegacy = createScraper('playwright-legacy');
```

## Examples

### Example: Scrape Multiple Sources

```javascript
import { getAllRankings } from './scrapers/index.js';

const allRankings = await getAllRankings({
  sources: ['flowrestling', 'ncaa']
});

console.log(`Total wrestlers: ${allRankings.length}`);
```

### Example: Compare Editions

```javascript
import { createScraper } from './scrapers/index.js';

const currentScraper = createScraper('flowrestling', { edition: 'current' });
const oldScraper = createScraper('flowrestling', { edition: 'edition-54317' });

const currentRankings = await currentScraper.fetchRankingsByWeight('125');
const oldRankings = await oldScraper.fetchRankingsByWeight('125');

// Compare rankings...
```

### Example: Custom Scraper with Debug Mode

```javascript
import { FlowWrestlingScraper } from './scrapers/index.js';

const scraper = new FlowWrestlingScraper({
  edition: 'current',
  usePlaywright: true,
  debugMode: true  // Saves HTML to debug files when no data found
});

const rankings = await scraper.fetchRankings();
await scraper.close();
```

## Troubleshooting

### No Rankings Found

1. Try with Playwright: `--playwright`
2. Check if the website structure has changed
3. Enable debug mode to save HTML output
4. Verify URLs in [config/rankings.js](src/scrapers/config/rankings.js)

### Playwright Issues

```bash
# Reinstall Playwright browsers
npx playwright install chromium

# Check if browser is accessible
node -e "import('playwright').then(pw => pw.chromium.launch())"
```

### Weight Class URLs

The URL pattern for FloWrestling weight classes follows:
```
https://www.flowrestling.org/rankings/{RANKING_ID}/{WEIGHT_ID}-{WEIGHT}-{WRESTLER_NAME}
```

Each edition has different weight IDs. If adding a new edition, you may need to find the correct URLs by browsing FloWrestling.

## Future Sources

Potential data sources to add:
- TrackWrestling rankings
- WIN Magazine rankings
- InterMat rankings
- WrestleStat rankings
- Team rankings
- Historical rankings

Each can be added by following the "Adding New Data Sources" section above.
