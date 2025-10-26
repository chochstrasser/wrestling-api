import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs';

export class PlaywrightScraper {
  /**
   * Alternative scraper using Playwright for JavaScript-rendered pages.
   * Requires: npm install playwright && npx playwright install chromium
   */

  static WEIGHT_CLASS_URLS = {
    "125": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54619-125-vincent-robinson",
    "133": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54620-133-lucas-byrd",
    "141": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54621-141-real-woods",
    "149": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54622-149-caleb-rathjen",
    "157": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54623-157-jacori-teemer",
    "165": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54624-165-dean-hamiti",
    "174": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54625-174-carter-starocci",
    "184": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54626-184-aaron-brooks",
    "197": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54627-197-stephen-buchanan",
    "285": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54628-285-wyatt-hendrickson"
  };

  /**
   * Fetch rankings using Playwright to render JavaScript.
   */
  async fetchRankings() {
    const wrestlers = [];
    const browser = await chromium.launch({ headless: true });

    try {
      for (const [weightClass, url] of Object.entries(PlaywrightScraper.WEIGHT_CLASS_URLS)) {
        try {
          const page = await browser.newPage();
          console.log(`Loading ${weightClass}lbs rankings with Playwright...`);

          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

          // Wait for content to load
          await page.waitForTimeout(3000);

          // Look for ranking elements to appear
          try {
            await page.waitForSelector('div[class*="rank"], li[class*="athlete"], tr[class*="wrestler"]', { timeout: 5000 });
          } catch (error) {
            console.log(`⚠️  No ranking elements found for ${weightClass}lbs`);
          }

          // Get the HTML after JS has rendered
          const content = await page.content();
          const $ = cheerio.load(content);

          // Parse the rankings for this weight class
          const weightWrestlers = this._parseFlowrestlingPlaywright($, weightClass);
          wrestlers.push(...weightWrestlers);

          if (weightWrestlers.length > 0) {
            console.log(`✓ Found ${weightWrestlers.length} wrestlers at ${weightClass}lbs`);
          } else {
            console.log(`⚠️  No wrestlers found at ${weightClass}lbs`);
            // Save HTML for debugging
            fs.writeFileSync(`flow_debug_${weightClass}.html`, content, 'utf-8');
          }

          await page.close();
        } catch (error) {
          console.log(`❌ Error scraping ${weightClass}lbs: ${error.message}`);
          continue;
        }
      }
    } finally {
      await browser.close();
    }

    return wrestlers;
  }

  _parseFlowrestlingPlaywright($, weightClass) {
    /**
     * Parse FloWrestling rankings from Playwright-rendered HTML
     * FloWrestling uses a simple HTML table structure with data-test="ranking-content"
     * Table columns: Rank, Grade, Name, School, Previous
     */
    const wrestlers = [];

    // Find the ranking content container
    const rankingContainer = $('div[data-test="ranking-content"]');

    if (rankingContainer.length === 0) {
      console.log(`  ⚠️  Could not find ranking-content container for ${weightClass}lbs`);
      return wrestlers;
    }

    // Find the table within the container
    const table = rankingContainer.find('table');

    if (table.length === 0) {
      console.log(`  ⚠️  Could not find table in ranking-content for ${weightClass}lbs`);
      return wrestlers;
    }

    // Get all rows from tbody
    let rows;
    const tbody = table.find('tbody');
    if (tbody.length === 0) {
      // If no tbody, get rows directly from table
      rows = table.find('tr');
    } else {
      rows = tbody.find('tr');
    }

    if (rows.length === 0) {
      console.log(`  ⚠️  No table rows found for ${weightClass}lbs`);
      return wrestlers;
    }

    // Skip the header row (first row) and process data rows
    rows.slice(1).each((i, row) => {
      const cells = $(row).find('td');

      // Table structure: Rank | Grade | Name | School | Previous
      if (cells.length >= 4) {
        try {
          const rankText = $(cells[0]).text().trim();
          const grade = $(cells[1]).text().trim();
          const name = $(cells[2]).text().trim();
          const school = $(cells[3]).text().trim();
          const previous = cells.length > 4 ? $(cells[4]).text().trim() : 'N/A';

          // Skip if this looks like a header row
          if (rankText.toLowerCase() === 'rank' || name.toLowerCase() === 'name') {
            return;
          }

          // Try to parse rank as integer
          const rank = parseInt(rankText);
          if (isNaN(rank)) {
            return;
          }

          const wrestler = {
            rank,
            name,
            school,
            weight_class: weightClass,
            source: 'FloWrestling',
            grade,
            previous_rank: previous
          };

          wrestlers.push(wrestler);
        } catch (error) {
          // Skip rows that don't match expected format
        }
      }
    });

    return wrestlers;
  }
}

export default PlaywrightScraper;
