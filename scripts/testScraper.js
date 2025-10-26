/**
 * Test the scraper without adding to database
 */
import { NCAAScraper } from '../src/scrapers/ncaa.js';
import { PlaywrightScraper } from '../src/scrapers/playwright.js';

async function testScraper(usePlaywright = false) {
  const scraperType = usePlaywright ? "Playwright" : "Basic";
  console.log(`Testing NCAA Wrestling Scraper (${scraperType})...`);
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
    console.log("Fetching rankings from sources...");
    const rankings = await scraper.fetchRankings();
    console.log(`\n✓ Fetched ${rankings.length} wrestler rankings\n`);

    if (rankings.length === 0) {
      console.log("⚠️  No rankings found from any source.");
      return;
    }

    // Display all results
    console.log("Results:");
    console.log("-".repeat(60));

    const byWeight = {};
    rankings.forEach(w => {
      if (!byWeight[w.weight_class]) {
        byWeight[w.weight_class] = [];
      }
      byWeight[w.weight_class].push(w);
    });

    Object.keys(byWeight).sort((a, b) => parseInt(a) - parseInt(b)).forEach(weight => {
      console.log(`\n${weight}lbs:`);
      byWeight[weight].slice(0, 10).forEach(w => {
        console.log(`  ${w.rank}. ${w.name} (${w.school}) - ${w.source}`);
      });
      if (byWeight[weight].length > 10) {
        console.log(`  ... and ${byWeight[weight].length - 10} more`);
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log(`Total wrestlers found: ${rankings.length}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const usePlaywright = args.includes('--playwright') || args.includes('-p');

testScraper(usePlaywright);
