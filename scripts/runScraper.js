/**
 * Script to run the NCAA scraper and populate the database
 */
import { NCAAScraper } from '../src/scrapers/ncaa.js';
import { PlaywrightScraper } from '../src/scrapers/playwright.js';
import { initDatabase, Wrestler } from '../src/database.js';

async function runScraper(usePlaywright = false) {
  const scraperType = usePlaywright ? "Playwright" : "Basic";
  console.log(`Starting NCAA Wrestling Scraper (${scraperType})...`);
  console.log("=".repeat(60));

  let scraper;
  if (usePlaywright) {
    try {
      scraper = new PlaywrightScraper();
    } catch (error) {
      console.log("❌ Playwright not installed!");
      console.log("\nTo use Playwright scraper, run:");
      console.log("  yarn add playwright");
      console.log("  npx playwright install chromium");
      return;
    }
  } else {
    scraper = new NCAAScraper();
  }

  try {
    await initDatabase();

    console.log("Fetching rankings from sources...");
    const rankings = await scraper.fetchRankings();
    console.log(`✓ Fetched ${rankings.length} wrestler rankings\n`);

    if (rankings.length === 0) {
      console.log("⚠️  No rankings found from any source.");
      console.log("This is expected if the websites are using JavaScript rendering.");
      console.log("\nOptions:");
      console.log("1. Use the Playwright scraper: node scripts/runScraper.js --playwright");
      console.log("2. Import from CSV: node scripts/importCsv.js create");
      console.log("3. Manually add data via the API");
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
      source: item.source || 'NCAA'
    }));

    await Wrestler.bulkCreate(wrestlersToAdd);
    console.log(`✅ Successfully added ${wrestlersToAdd.length} wrestler records to database`);

    // Verify
    const finalCount = await Wrestler.count();
    console.log(`Total wrestlers in database: ${finalCount}`);

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const usePlaywright = args.includes('--playwright') || args.includes('-p');

runScraper(usePlaywright);
