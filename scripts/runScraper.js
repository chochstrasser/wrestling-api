/**
 * Script to run the NCAA scraper and populate the database
 */
import { createScraper, getAvailableEditions } from '../src/scrapers/index.js';
import { initDatabase, Wrestler } from '../src/database.js';

async function runScraper(options = {}) {
  const {
    source = 'flowrestling',
    edition = 'current'
  } = options;

  console.log(`Starting Wrestling Scraper...`);
  console.log(`Source: ${source}, Edition: ${edition}`);
  console.log("=".repeat(60));

  let scraper;
  try {
    scraper = createScraper(source, {
      usePlaywright: true,
      edition
    });
  } catch (error) {
    console.log(`❌ Error creating scraper: ${error.message}`);
    console.log("\nTo use the scraper, ensure Playwright is installed:");
    console.log("  yarn playwright install chromium");
    return;
  }

  try {
    await initDatabase();

    console.log("Fetching rankings from sources...");
    const rankings = await scraper.fetchRankings();
    console.log(`✓ Fetched ${rankings.length} wrestler rankings\n`);

    if (rankings.length === 0) {
      console.log("⚠️  No rankings found from any source.");
      console.log("\nOptions:");
      console.log("1. Import from CSV: node scripts/importCsv.js create");
      console.log("2. Manually add data via the API");
      return;
    }

    // Display sample of what was found
    console.log("Sample of fetched data:");
    for (let i = 0; i < Math.min(3, rankings.length); i++) {
      const w = rankings[i];
      console.log(`  ${w.rank}. ${w.name} (${w.school}) - ${w.weight_class}lbs - Source: ${w.source}`);
    }

    if (rankings.length > 3) {
      console.log(`  ... and ${rankings.length - 3} more`);
    }

    console.log("\nAdding to database...");

    // Clear existing data (optional - comment out if you want to keep old data)
    const existingCount = await Wrestler.count();
    if (existingCount > 0) {
      console.log(`  Clearing ${existingCount} existing records...`);
      await Wrestler.destroy({ where: {}, truncate: true });
    }

    // Add new rankings
    const wrestlersToAdd = rankings.map(item => ({
      name: item.name || 'Unknown',
      school: item.school || 'Unknown',
      weight_class: item.weight_class || 'Unknown',
      rank: item.rank || 0,
      grade: item.grade || null,
      source: item.source || 'NCAA'
    }));

    await Wrestler.bulkCreate(wrestlersToAdd);
    console.log(`✅ Successfully added ${wrestlersToAdd.length} wrestler records to database`);

    // Verify
    const finalCount = await Wrestler.count();
    console.log(`Total wrestlers in database: ${finalCount}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
  } finally {
    if (scraper && scraper.close) {
      await scraper.close();
    }
  }
}

// Show available options
function showHelp() {
  console.log("Usage: node scripts/runScraper.js [options]");
  console.log("\nOptions:");
  console.log("  -s, --source <name>    Source to scrape (flowrestling, ncaa)");
  console.log("  -e, --edition <name>   Edition to scrape (current, edition-54317, etc.)");
  console.log("  --list-editions        List all available editions");
  console.log("  -h, --help             Show this help message");
  console.log("\nExamples:");
  console.log("  node scripts/runScraper.js");
  console.log("  node scripts/runScraper.js --source flowrestling --edition edition-54317");
  console.log("  node scripts/runScraper.js --source ncaa");
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--list-editions')) {
  console.log("Available FloWrestling editions:");
  const editions = getAvailableEditions();
  editions.forEach(edition => {
    console.log(`  ${edition.key}: ${edition.name}`);
  });
  process.exit(0);
}

const options = {
  source: 'flowrestling',
  edition: 'current'
};

// Parse source
const sourceIndex = args.findIndex(arg => arg === '-s' || arg === '--source');
if (sourceIndex !== -1 && args[sourceIndex + 1]) {
  options.source = args[sourceIndex + 1];
}

// Parse edition
const editionIndex = args.findIndex(arg => arg === '-e' || arg === '--edition');
if (editionIndex !== -1 && args[editionIndex + 1]) {
  options.edition = args[editionIndex + 1];
}

runScraper(options);
