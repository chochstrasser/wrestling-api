import { BaseScraper } from '../base/BaseScraper.js';
import { NCAA_RANKINGS } from '../config/rankings.js';

/**
 * NCAA Official Rankings Scraper
 * Scrapes rankings from NCAA.com official website
 */
export class NCAAOfficialScraper extends BaseScraper {
  constructor(options = {}) {
    super(options);
    this.url = NCAA_RANKINGS.official.url;
  }

  /**
   * Fetch all rankings from NCAA.com
   */
  async fetchRankings() {
    try {
      console.log('Scraping NCAA official rankings...');

      const $ = await this.fetchStatic(this.url);

      if (!$) {
        console.log('Failed to fetch NCAA rankings');
        return [];
      }

      const wrestlers = this._parseRankings($);

      console.log(`✓ Found ${wrestlers.length} wrestlers from NCAA.com`);
      return wrestlers;
    } catch (error) {
      console.log(`Error fetching NCAA rankings: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch rankings for a specific weight class
   */
  async fetchRankingsByWeight(weightClass) {
    const allRankings = await this.fetchRankings();
    const weightClassStr = String(weightClass);
    return allRankings.filter(w => w.weight_class === weightClassStr);
  }

  /**
   * Parse NCAA.com rankings from HTML
   */
  _parseRankings($) {
    const wrestlers = [];

    // Look for ranking tables
    $('table.rankings, table.table, table').each((i, table) => {
      const rows = $(table).find('tr');

      // Skip header row
      rows.slice(1).each((j, row) => {
        const cols = $(row).find('td, th');

        if (cols.length >= 3) {
          try {
            // Typical NCAA table structure: Rank | Name | School | Weight (optional)
            const rankText = $(cols[0]).text().trim();
            const name = $(cols[1]).text().trim();
            const school = cols.length > 2 ? $(cols[2]).text().trim() : 'Unknown';
            const weight = cols.length > 3 ? $(cols[3]).text().trim() : 'Unknown';

            // Skip header rows
            if (rankText.toLowerCase() === 'rank' || name.toLowerCase() === 'name') {
              return;
            }

            const rank = parseInt(rankText);
            if (isNaN(rank)) {
              return;
            }

            wrestlers.push(this.normalizeWrestler({
              rank,
              name,
              school,
              weight_class: this._normalizeWeightClass(weight),
              source: 'NCAA.com'
            }));
          } catch (error) {
            // Skip invalid rows
          }
        }
      });
    });

    // Also check for div-based rankings
    if (wrestlers.length === 0) {
      wrestlers.push(...this._parseDivBasedRankings($));
    }

    return wrestlers;
  }

  /**
   * Parse rankings from div-based layout (alternative structure)
   */
  _parseDivBasedRankings($) {
    const wrestlers = [];

    $('div[class*="rank"], div[class*="athlete"], div[class*="player"]').each((i, elem) => {
      try {
        const text = $(elem).text().trim();

        // Try to extract rank, name, and school
        const match = text.match(/(\d+)\.\s*([A-Za-z\s]+?)\s+-\s+([A-Za-z\s]+)/);
        if (match) {
          wrestlers.push(this.normalizeWrestler({
            rank: parseInt(match[1]),
            name: match[2].trim(),
            school: match[3].trim(),
            weight_class: 'Unknown',
            source: 'NCAA.com'
          }));
        }
      } catch (error) {
        // Skip invalid elements
      }
    });

    return wrestlers;
  }

  /**
   * Normalize weight class format (e.g., "125 lbs" -> "125")
   */
  _normalizeWeightClass(weight) {
    if (!weight || weight === 'Unknown') {
      return 'Unknown';
    }

    // Extract numbers from weight string
    const match = weight.match(/(\d+)/);
    return match ? match[1] : weight;
  }
}

export default NCAAOfficialScraper;
