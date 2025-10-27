import { fetchStatic, normalizeWrestler } from '../base/BaseScraper.js';
import { NCAA_RANKINGS } from '../config/rankings.js';

/**
 * NCAA Official Rankings Scraper
 * Scrapes rankings from NCAA.com official website
 */

const NCAA_URL = NCAA_RANKINGS.official.url;

/**
 * Normalize weight class format (e.g., "125 lbs" -> "125")
 * @param {string} weight - Weight class string
 * @returns {string} Normalized weight class
 */
function normalizeWeightClass(weight) {
  if (!weight || weight === 'Unknown') {
    return 'Unknown';
  }

  // Extract numbers from weight string
  const match = weight.match(/(\d+)/);
  return match ? match[1] : weight;
}

/**
 * Parse rankings from div-based layout (alternative structure)
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Array} Array of wrestler objects
 */
function parseDivBasedRankings($) {
  const wrestlers = [];

  $('div[class*="rank"], div[class*="athlete"], div[class*="player"]').each((i, elem) => {
    try {
      const text = $(elem).text().trim();

      // Try to extract rank, name, and school
      const match = text.match(/(\d+)\.\s*([A-Za-z\s]+?)\s+-\s+([A-Za-z\s]+)/);
      if (match) {
        wrestlers.push(normalizeWrestler({
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
 * Parse NCAA.com rankings from HTML
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Array} Array of wrestler objects
 */
function parseRankings($) {
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

          wrestlers.push(normalizeWrestler({
            rank,
            name,
            school,
            weight_class: normalizeWeightClass(weight),
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
    wrestlers.push(...parseDivBasedRankings($));
  }

  return wrestlers;
}

/**
 * Fetch all rankings from NCAA.com
 * @returns {Promise<Array>} Array of wrestler objects
 */
export async function fetchRankings() {
  try {
    console.log('Scraping NCAA official rankings...');

    const $ = await fetchStatic(NCAA_URL);

    if (!$) {
      console.log('Failed to fetch NCAA rankings');
      return [];
    }

    const wrestlers = parseRankings($);

    console.log(`✓ Found ${wrestlers.length} wrestlers from NCAA.com`);
    return wrestlers;
  } catch (error) {
    console.log(`Error fetching NCAA rankings: ${error.message}`);
    return [];
  }
}

/**
 * Fetch rankings for a specific weight class
 * @param {string|number} weightClass - Weight class to fetch
 * @returns {Promise<Array>} Array of wrestler objects
 */
export async function fetchRankingsByWeight(weightClass) {
  const allRankings = await fetchRankings();
  const weightClassStr = String(weightClass);
  return allRankings.filter(w => w.weight_class === weightClassStr);
}

// Default export for backward compatibility
export default {
  fetchRankings,
  fetchRankingsByWeight
};
