/**
 * Test the scraper without adding to database
 */
import { createScraper, getAvailableEditions } from "../src/scrapers/index.js";

async function testScraper(options = {}) {
  const {
    source = "flowrestling",
    edition = "current",
  } = options;

  console.log(`Testing Wrestling Scraper...`);
  console.log(`Source: ${source}, Edition: ${edition}`);
  console.log("=".repeat(60));

  let scraper;
  try {
    scraper = createScraper(source, {
      usePlaywright: true,
      edition,
    });
  } catch (error) {
    console.log(`❌ Error creating scraper: ${error.message}`);
    console.log("\nTo use the scraper, ensure Playwright is installed:");
    console.log("  yarn playwright install chromium");
    return;
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
    rankings.forEach((w) => {
      if (!byWeight[w.weight_class]) {
        byWeight[w.weight_class] = [];
      }
      byWeight[w.weight_class].push(w);
    });

    Object.keys(byWeight)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach((weight) => {
        console.log(`\n${weight}lbs:`);
        byWeight[weight].slice(0, 10).forEach((w) => {
          const gradeInfo = w.grade ? ` [${w.grade}]` : '';
          console.log(`  ${w.rank}. ${w.name} (${w.school})${gradeInfo} - ${w.source}`);
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
  } finally {
    if (scraper && scraper.close) {
      await scraper.close();
    }
  }
}

// Show available options
function showHelp() {
  console.log("Usage: node scripts/testScraper.js [options]");
  console.log("\nOptions:");
  console.log(
    "  -s, --source <name>    Source to scrape (flowrestling, ncaa)"
  );
  console.log(
    "  -e, --edition <name>   Edition to scrape (current, edition-54317, etc.)"
  );
  console.log("  --list-editions        List all available editions");
  console.log("  -h, --help             Show this help message");
  console.log("\nExamples:");
  console.log("  node scripts/testScraper.js");
  console.log(
    "  node scripts/testScraper.js --source flowrestling --edition edition-54317"
  );
  console.log("  node scripts/testScraper.js --source ncaa");
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes("-h") || args.includes("--help")) {
  showHelp();
  process.exit(0);
}

if (args.includes("--list-editions")) {
  console.log("Available FloWrestling editions:");
  const editions = getAvailableEditions();
  editions.forEach((edition) => {
    console.log(`  ${edition.key}: ${edition.name}`);
  });
  process.exit(0);
}

const options = {
  source: "flowrestling",
  edition: "current",
};

// Parse source
const sourceIndex = args.findIndex((arg) => arg === "-s" || arg === "--source");
if (sourceIndex !== -1 && args[sourceIndex + 1]) {
  options.source = args[sourceIndex + 1];
}

// Parse edition
const editionIndex = args.findIndex(
  (arg) => arg === "-e" || arg === "--edition"
);
if (editionIndex !== -1 && args[editionIndex + 1]) {
  options.edition = args[editionIndex + 1];
}

testScraper(options);
