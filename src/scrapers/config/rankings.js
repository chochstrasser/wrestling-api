/**
 * Configuration for wrestling ranking sources and URLs
 *
 * This file centralizes all ranking source configurations, making it easy to:
 * - Add new ranking editions (different time periods)
 * - Add new data sources
 * - Manage weight class URLs
 * - Switch between ranking versions
 */

export const WEIGHT_CLASSES = ['125', '133', '141', '149', '157', '165', '174', '184', '197', '285'];

/**
 * FloWrestling Rankings Configuration
 * Multiple editions can be tracked (current, previous weeks, etc.)
 */
export const FLOWRESTLING_RANKINGS = {
  // Current/Latest Rankings (as of your original scraper)
  'current': {
    name: '2025-26 NCAA DI Wrestling Rankings (Current)',
    baseUrl: 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings',
    weightClasses: {
      '125': 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54619-125-vincent-robinson',
      '133': 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54620-133-lucas-byrd',
      '141': 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54621-141-real-woods',
      '149': 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54622-149-caleb-rathjen',
      '157': 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54623-157-jacori-teemer',
      '165': 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54624-165-dean-hamiti',
      '174': 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54625-174-carter-starocci',
      '184': 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54626-184-aaron-brooks',
      '197': 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54627-197-stephen-buchanan',
      '285': 'https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54628-285-wyatt-hendrickson'
    }
  }
};

/**
 * NCAA Official Rankings Configuration
 */
export const NCAA_RANKINGS = {
  'official': {
    name: 'NCAA Official Rankings',
    url: 'https://www.ncaa.com/rankings/wrestling/d1'
  }
};

/**
 * Default edition to use when none is specified
 */
export const DEFAULT_FLOWRESTLING_EDITION = 'current';

/**
 * Get FloWrestling ranking URLs for a specific edition
 */
export function getFlowrestlingEdition(edition = DEFAULT_FLOWRESTLING_EDITION) {
  return FLOWRESTLING_RANKINGS[edition] || FLOWRESTLING_RANKINGS[DEFAULT_FLOWRESTLING_EDITION];
}

/**
 * Get all available FloWrestling editions
 */
export function getAvailableEditions() {
  return Object.keys(FLOWRESTLING_RANKINGS).map(key => ({
    key,
    name: FLOWRESTLING_RANKINGS[key].name
  }));
}

/**
 * Template for adding new ranking sources
 *
 * Example usage:
 *
 * export const TRACKWRESTLING_RANKINGS = {
 *   'current': {
 *     name: 'TrackWrestling Rankings',
 *     weightClasses: {
 *       '125': 'https://...',
 *       ...
 *     }
 *   }
 * };
 */

export default {
  WEIGHT_CLASSES,
  FLOWRESTLING_RANKINGS,
  NCAA_RANKINGS,
  DEFAULT_FLOWRESTLING_EDITION,
  getFlowrestlingEdition,
  getAvailableEditions
};
