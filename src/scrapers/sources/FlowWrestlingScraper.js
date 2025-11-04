import { fetchStatic, fetchDynamic, delay, normalizeWrestler, createBrowser, fetchDynamicWithBrowser } from '../base/BaseScraper.js';
import { getFlowrestlingEdition, DEFAULT_FLOWRESTLING_EDITION } from '../config/rankings.js';
import fs from 'fs';

/**
 * FlowWrestling-specific scraper
 * Handles both static and dynamic (Playwright) scraping for FloWrestling rankings
 */

/**
 * Parse ranking table (typical Playwright-rendered structure)
 * @param {Object} container - Cheerio container element
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} weightClass - Weight class
 * @param {string} edition - Edition identifier
 * @returns {Array} Array of wrestler objects
 */
function parseRankingTable(container, $, weightClass, edition) {
  const wrestlers = [];
  const table = container.find('table');

  if (table.length === 0) {
    return wrestlers;
  }

  const tbody = table.find('tbody');
  const rows = tbody.length > 0 ? tbody.find('tr') : table.find('tr');

  // Skip header row and process data rows
  rows.slice(1).each((i, row) => {
    const cells = $(row).find('td');

    // Table structure: Rank | Grade | Name | School | Previous
    if (cells.length >= 4) {
      try {
        const rankText = $(cells[0]).text().trim();
        const grade = $(cells[1]).text().trim();
        const name = $(cells[2]).text().trim();
        const school = $(cells[3]).text().trim();
        const previous = cells.length > 4 ? $(cells[4]).text().trim() : null;

        // Skip header rows
        if (rankText.toLowerCase() === 'rank' || name.toLowerCase() === 'name') {
          return;
        }

        const rank = parseInt(rankText);
        if (isNaN(rank)) {
          return;
        }

        // Normalize grade to match enum values (FR, SO, JR, SR)
        let normalizedGrade = null;
        if (grade) {
          const gradeUpper = grade.toUpperCase();
          if (['FR', 'SO', 'JR', 'SR'].includes(gradeUpper)) {
            normalizedGrade = gradeUpper;
          } else if (gradeUpper.includes('FR')) {
            normalizedGrade = 'FR';
          } else if (gradeUpper.includes('SO')) {
            normalizedGrade = 'SO';
          } else if (gradeUpper.includes('JR')) {
            normalizedGrade = 'JR';
          } else if (gradeUpper.includes('SR')) {
            normalizedGrade = 'SR';
          }
        }

        wrestlers.push(normalizeWrestler({
          rank,
          name,
          school,
          weight_class: weightClass,
          source: `FloWrestling (${edition})`,
          grade: normalizedGrade,
          previous_rank: previous
        }));
      } catch (error) {
        // Skip malformed rows
      }
    }
  });

  return wrestlers;
}

/**
 * Parse JSON-LD structured data
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} weightClass - Weight class
 * @param {string} edition - Edition identifier
 * @returns {Array} Array of wrestler objects
 */
function parseJsonLd($, weightClass, edition) {
  const wrestlers = [];

  $('script[type="application/ld+json"]').each((i, elem) => {
    try {
      const data = JSON.parse($(elem).html());
      if (data.itemListElement) {
        data.itemListElement.forEach(item => {
          if (item.name && item.position) {
            wrestlers.push(normalizeWrestler({
              rank: item.position,
              name: item.name,
              school: item.affiliation || 'Unknown',
              weight_class: weightClass,
              source: `FloWrestling (${edition})`
            }));
          }
        });
      }
    } catch (error) {
      // Skip invalid JSON
    }
  });

  return wrestlers;
}

/**
 * Parse embedded JSON in script tags
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} weightClass - Weight class
 * @param {string} edition - Edition identifier
 * @returns {Array} Array of wrestler objects
 */
function parseEmbeddedJson($, weightClass, edition) {
  const wrestlers = [];

  $('script').each((i, elem) => {
    const scriptText = $(elem).html();
    if (scriptText && scriptText.toLowerCase().includes('ranking') && scriptText.toLowerCase().includes('athlete')) {
      try {
        const jsonMatches = scriptText.match(/\{[^{}]*"name"[^{}]*\}/g);
        if (jsonMatches) {
          jsonMatches.forEach(match => {
            try {
              const athleteData = JSON.parse(match);
              if (athleteData.name) {
                wrestlers.push(normalizeWrestler({
                  rank: wrestlers.length + 1,
                  name: athleteData.name,
                  school: athleteData.school || athleteData.team || 'Unknown',
                  weight_class: weightClass,
                  source: `FloWrestling (${edition})`
                }));
              }
            } catch (error) {
              // Skip invalid JSON
            }
          });
        }
      } catch (error) {
        // Skip parsing errors
      }
    }
  });

  return wrestlers;
}

/**
 * Fallback: Parse HTML structure
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} weightClass - Weight class
 * @param {string} edition - Edition identifier
 * @returns {Array} Array of wrestler objects
 */
function parseHtmlStructure($, weightClass, edition) {
  const wrestlers = [];

  const rankingElements = $('div, li, tr').filter((i, elem) => {
    const className = $(elem).attr('class') || '';
    return ['rank', 'athlete', 'wrestler', 'player'].some(keyword =>
      className.toLowerCase().includes(keyword)
    );
  });

  rankingElements.slice(0, 20).each((i, elem) => {
    const text = $(elem).text().trim();

    // Pattern: "Name (School)"
    let match = text.match(/([A-Za-z\s]+)\s*\(([^)]+)\)/);
    if (match) {
      wrestlers.push(normalizeWrestler({
        rank: i + 1,
        name: match[1].trim(),
        school: match[2].trim(),
        weight_class: weightClass,
        source: `FloWrestling (${edition})`
      }));
      return;
    }

    // Pattern: "Rank. Name School"
    match = text.match(/(\d+)\.\s*([A-Za-z\s]+?)\s+([A-Za-z\s]+)$/);
    if (match) {
      wrestlers.push(normalizeWrestler({
        rank: parseInt(match[1]),
        name: match[2].trim(),
        school: match[3].trim(),
        weight_class: weightClass,
        source: `FloWrestling (${edition})`
      }));
    }
  });

  return wrestlers;
}

/**
 * Parse FloWrestling rankings from HTML
 * Supports both static and Playwright-rendered content
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} weightClass - Weight class
 * @param {string} edition - Edition identifier
 * @returns {Array} Array of wrestler objects
 */
function parseRankings($, weightClass, edition) {
  // Method 1: Look for structured data container (Playwright-rendered)
  const rankingContainer = $('div[data-test="ranking-content"]');

  if (rankingContainer.length > 0) {
    return parseRankingTable(rankingContainer, $, weightClass, edition);
  }

  // Method 2: Try to find JSON-LD structured data
  const jsonLdWrestlers = parseJsonLd($, weightClass, edition);
  if (jsonLdWrestlers.length > 0) {
    return jsonLdWrestlers;
  }

  // Method 3: Try to find embedded JSON data in script tags
  const embeddedJsonWrestlers = parseEmbeddedJson($, weightClass, edition);
  if (embeddedJsonWrestlers.length > 0) {
    return embeddedJsonWrestlers;
  }

  // Method 4: Fallback to HTML structure parsing
  return parseHtmlStructure($, weightClass, edition);
}

/**
 * Fetch content using Playwright for JavaScript-rendered pages
 * @param {string} url - URL to fetch
 * @param {Object} browser - Playwright browser instance (optional)
 * @returns {Promise<CheerioAPI|null>} Cheerio instance or null
 */
async function fetchWithPlaywright(url, browser = null) {
  const options = {
    waitTime: 3000,
    waitForSelector: 'div[data-test="ranking-content"]',
    timeout: 30000
  };

  if (browser) {
    return await fetchDynamicWithBrowser(browser, url, options);
  }

  return await fetchDynamic(url, options);
}

/**
 * Fetch all rankings across all weight classes
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} Array of wrestler objects
 */
export async function fetchRankings(options = {}) {
  const edition = options.edition || DEFAULT_FLOWRESTLING_EDITION;
  const rankingConfig = getFlowrestlingEdition(edition);
  const debugMode = options.debugMode || false;
  const usePlaywright = options.usePlaywright || false;

  const wrestlers = [];
  const weightClasses = rankingConfig.weightClasses;

  let browser = null;
  if (usePlaywright) {
    browser = await createBrowser();
  }

  try {
    for (const [weightClass, url] of Object.entries(weightClasses)) {
      try {
        console.log(`Scraping ${weightClass}lbs from FloWrestling (${edition})...`);

        const $ = usePlaywright
          ? await fetchWithPlaywright(url, browser)
          : await fetchStatic(url);

        if (!$) {
          console.log(`⚠️  Failed to fetch ${weightClass}lbs`);
          continue;
        }

        const weightWrestlers = parseRankings($, weightClass, edition);
        wrestlers.push(...weightWrestlers);

        if (weightWrestlers.length > 0) {
          console.log(`✓ Found ${weightWrestlers.length} wrestlers at ${weightClass}lbs`);
        } else {
          console.log(`⚠️  No wrestlers found at ${weightClass}lbs`);
          if (debugMode) {
            fs.writeFileSync(`debug_flow_${edition}_${weightClass}.html`, $.html(), 'utf-8');
          }
        }

        await delay(500);
      } catch (error) {
        console.log(`❌ Error scraping ${weightClass}lbs: ${error.message}`);
        continue;
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return wrestlers;
}

/**
 * Fetch rankings for a specific weight class
 * @param {string|number} weightClass - Weight class to fetch
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} Array of wrestler objects
 */
export async function fetchRankingsByWeight(weightClass, options = {}) {
  const edition = options.edition || DEFAULT_FLOWRESTLING_EDITION;
  const rankingConfig = getFlowrestlingEdition(edition);
  const usePlaywright = options.usePlaywright || false;

  const weightClassStr = String(weightClass);
  const url = rankingConfig.weightClasses[weightClassStr];

  if (!url) {
    console.log(`Weight class ${weightClass} not found in ${edition} edition`);
    return [];
  }

  try {
    const $ = usePlaywright
      ? await fetchWithPlaywright(url)
      : await fetchStatic(url);

    if (!$) {
      return [];
    }

    return parseRankings($, weightClassStr, edition);
  } catch (error) {
    console.log(`Error fetching ${weightClass}lbs: ${error.message}`);
    return [];
  }
}

// Default export for backward compatibility
export default {
  fetchRankings,
  fetchRankingsByWeight
};
