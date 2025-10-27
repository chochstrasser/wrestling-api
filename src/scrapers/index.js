/**
 * Wrestling Scrapers - Centralized Export
 *
 * This file provides a clean interface for accessing all wrestling scrapers.
 */

// Base scraper
export { BaseScraper } from './base/BaseScraper.js';

// Source-specific scrapers
export { FlowWrestlingScraper } from './sources/FlowWrestlingScraper.js';
export { NCAAOfficialScraper } from './sources/NCAAOfficialScraper.js';

// Configuration
export {
  WEIGHT_CLASSES,
  FLOWRESTLING_RANKINGS,
  NCAA_RANKINGS,
  DEFAULT_FLOWRESTLING_EDITION,
  getFlowrestlingEdition,
  getAvailableEditions
} from './config/rankings.js';

// Legacy exports for backward compatibility
export { NCAAScraper } from './ncaa.js';
export { PlaywrightScraper } from './playwright.js';

/**
 * Factory function to create a scraper instance
 *
 * @param {string} source - Source name ('flowrestling', 'ncaa', 'ncaa-legacy', 'playwright-legacy')
 * @param {object} options - Scraper options
 * @returns {BaseScraper} Scraper instance
 *
 * @example
 * // Create FlowWrestling scraper with current edition
 * const scraper = createScraper('flowrestling');
 *
 * @example
 * // Create FlowWrestling scraper with specific edition
 * const scraper = createScraper('flowrestling', { edition: 'edition-54317' });
 *
 * @example
 * // Create FlowWrestling scraper with Playwright enabled
 * const scraper = createScraper('flowrestling', { usePlaywright: true });
 */
export function createScraper(source, options = {}) {
  const normalizedSource = source.toLowerCase();

  switch (normalizedSource) {
    case 'flowrestling':
    case 'flow':
      return new FlowWrestlingScraper(options);

    case 'ncaa':
    case 'ncaa-official':
      return new NCAAOfficialScraper(options);

    case 'ncaa-legacy':
      const { NCAAScraper } = await import('./ncaa.js');
      return new NCAAScraper();

    case 'playwright-legacy':
      const { PlaywrightScraper } = await import('./playwright.js');
      return new PlaywrightScraper();

    default:
      throw new Error(`Unknown scraper source: ${source}. Available: flowrestling, ncaa, ncaa-legacy, playwright-legacy`);
  }
}

/**
 * Get rankings from all sources
 *
 * @param {object} options - Options for scraping
 * @returns {Promise<Array>} Combined rankings from all sources
 *
 * @example
 * const allRankings = await getAllRankings();
 */
export async function getAllRankings(options = {}) {
  const results = [];
  const sources = options.sources || ['flowrestling', 'ncaa'];

  for (const source of sources) {
    try {
      const scraper = createScraper(source, options);
      const rankings = await scraper.fetchRankings();
      results.push(...rankings);

      if (scraper.close) {
        await scraper.close();
      }
    } catch (error) {
      console.error(`Error fetching from ${source}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Get rankings for a specific weight class from all sources
 *
 * @param {string|number} weightClass - Weight class (e.g., '125', 133)
 * @param {object} options - Options for scraping
 * @returns {Promise<Array>} Rankings for the specified weight class
 *
 * @example
 * const rankings125 = await getRankingsByWeight('125');
 */
export async function getRankingsByWeight(weightClass, options = {}) {
  const results = [];
  const sources = options.sources || ['flowrestling', 'ncaa'];

  for (const source of sources) {
    try {
      const scraper = createScraper(source, options);
      const rankings = await scraper.fetchRankingsByWeight(weightClass);
      results.push(...rankings);

      if (scraper.close) {
        await scraper.close();
      }
    } catch (error) {
      console.error(`Error fetching ${weightClass}lbs from ${source}: ${error.message}`);
    }
  }

  return results;
}

export default {
  BaseScraper,
  FlowWrestlingScraper,
  NCAAOfficialScraper,
  NCAAScraper,
  PlaywrightScraper,
  createScraper,
  getAllRankings,
  getRankingsByWeight,
  getAvailableEditions
};
