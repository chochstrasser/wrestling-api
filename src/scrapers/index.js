/**
 * Wrestling Scrapers - Centralized Export
 *
 * This file provides a clean interface for accessing all wrestling scrapers.
 */

// Import base utilities for default export
import {
  createAxiosInstance,
  fetchStatic,
  fetchDynamic,
  createBrowser,
  fetchDynamicWithBrowser,
  delay,
  normalizeWrestler
} from "./base/BaseScraper.js";

// Base scraper utilities (functional exports)
export {
  createAxiosInstance,
  fetchStatic,
  fetchDynamic,
  createBrowser,
  fetchDynamicWithBrowser,
  delay,
  normalizeWrestler
};

// Base scraper utilities re-exported for convenience
export { default as BaseScraper } from "./base/BaseScraper.js";

// Import source-specific scrapers for default export
import {
  fetchRankings as fetchFlowWrestlingRankings,
  fetchRankingsByWeight as fetchFlowWrestlingRankingsByWeight
} from "./sources/FlowWrestlingScraper.js";

import {
  fetchRankings as fetchNCAAOfficialRankings,
  fetchRankingsByWeight as fetchNCAAOfficialRankingsByWeight
} from "./sources/NCAAOfficialScraper.js";

// Source-specific scrapers (functional exports)
export {
  fetchFlowWrestlingRankings,
  fetchFlowWrestlingRankingsByWeight,
  fetchNCAAOfficialRankings,
  fetchNCAAOfficialRankingsByWeight
};

// Source-specific scrapers re-exported for convenience
export { default as FlowWrestlingScraper } from "./sources/FlowWrestlingScraper.js";
export { default as NCAAOfficialScraper } from "./sources/NCAAOfficialScraper.js";

// Import configuration for default export
import {
  WEIGHT_CLASSES,
  FLOWRESTLING_RANKINGS,
  NCAA_RANKINGS,
  DEFAULT_FLOWRESTLING_EDITION,
  getFlowrestlingEdition,
  getAvailableEditions,
} from "./config/rankings.js";

// Configuration exports
export {
  WEIGHT_CLASSES,
  FLOWRESTLING_RANKINGS,
  NCAA_RANKINGS,
  DEFAULT_FLOWRESTLING_EDITION,
  getFlowrestlingEdition,
  getAvailableEditions,
};


/**
 * Factory function to create a scraper wrapper
 *
 * @param {string} source - Source name ('flowrestling', 'ncaa')
 * @param {object} options - Scraper options
 * @returns {Object} Scraper object with fetchRankings and fetchRankingsByWeight methods
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
    case "flowrestling":
    case "flow":
      return {
        fetchRankings: () => fetchFlowWrestlingRankings(options),
        fetchRankingsByWeight: (weightClass) => fetchFlowWrestlingRankingsByWeight(weightClass, options),
        close: async () => {} // No-op for compatibility
      };

    case "ncaa":
    case "ncaa-official":
      return {
        fetchRankings: fetchNCAAOfficialRankings,
        fetchRankingsByWeight: fetchNCAAOfficialRankingsByWeight,
        close: async () => {} // No-op for compatibility
      };

    default:
      throw new Error(
        `Unknown scraper source: ${source}. Available: flowrestling, ncaa`
      );
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
  const sources = options.sources || ["flowrestling", "ncaa"];

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
  const sources = options.sources || ["flowrestling", "ncaa"];

  for (const source of sources) {
    try {
      const scraper = createScraper(source, options);
      const rankings = await scraper.fetchRankingsByWeight(weightClass);
      results.push(...rankings);

      if (scraper.close) {
        await scraper.close();
      }
    } catch (error) {
      console.error(
        `Error fetching ${weightClass}lbs from ${source}: ${error.message}`
      );
    }
  }

  return results;
}

export default {
  // Utility functions
  createAxiosInstance,
  fetchStatic,
  fetchDynamic,
  createBrowser,
  fetchDynamicWithBrowser,
  delay,
  normalizeWrestler,

  // Scraper functions
  fetchFlowWrestlingRankings,
  fetchFlowWrestlingRankingsByWeight,
  fetchNCAAOfficialRankings,
  fetchNCAAOfficialRankingsByWeight,

  // Factory and helper functions
  createScraper,
  getAllRankings,
  getRankingsByWeight,
  getAvailableEditions,
};
