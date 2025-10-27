import { BaseScraper } from '../base/BaseScraper.js';
import { getFlowrestlingEdition, DEFAULT_FLOWRESTLING_EDITION } from '../config/rankings.js';
import fs from 'fs';

/**
 * FlowWrestling-specific scraper
 * Handles both static and dynamic (Playwright) scraping for FloWrestling rankings
 */
export class FlowWrestlingScraper extends BaseScraper {
  constructor(options = {}) {
    super(options);
    this.edition = options.edition || DEFAULT_FLOWRESTLING_EDITION;
    this.rankingConfig = getFlowrestlingEdition(this.edition);
    this.debugMode = options.debugMode || false;
  }

  /**
   * Fetch all rankings across all weight classes
   */
  async fetchRankings() {
    const wrestlers = [];
    const weightClasses = this.rankingConfig.weightClasses;

    for (const [weightClass, url] of Object.entries(weightClasses)) {
      try {
        console.log(`Scraping ${weightClass}lbs from FloWrestling (${this.edition})...`);

        const $ = this.usePlaywright
          ? await this._fetchWithPlaywright(url, weightClass)
          : await this.fetchStatic(url);

        if (!$) {
          console.log(`⚠️  Failed to fetch ${weightClass}lbs`);
          continue;
        }

        const weightWrestlers = this._parseRankings($, weightClass);
        wrestlers.push(...weightWrestlers);

        if (weightWrestlers.length > 0) {
          console.log(`✓ Found ${weightWrestlers.length} wrestlers at ${weightClass}lbs`);
        } else {
          console.log(`⚠️  No wrestlers found at ${weightClass}lbs`);
          if (this.debugMode) {
            fs.writeFileSync(`debug_flow_${this.edition}_${weightClass}.html`, $.html(), 'utf-8');
          }
        }

        await this.delay(500);
      } catch (error) {
        console.log(`❌ Error scraping ${weightClass}lbs: ${error.message}`);
        continue;
      }
    }

    return wrestlers;
  }

  /**
   * Fetch rankings for a specific weight class
   */
  async fetchRankingsByWeight(weightClass) {
    const weightClassStr = String(weightClass);
    const url = this.rankingConfig.weightClasses[weightClassStr];

    if (!url) {
      console.log(`Weight class ${weightClass} not found in ${this.edition} edition`);
      return [];
    }

    try {
      const $ = this.usePlaywright
        ? await this._fetchWithPlaywright(url, weightClassStr)
        : await this.fetchStatic(url);

      if (!$) {
        return [];
      }

      return this._parseRankings($, weightClassStr);
    } catch (error) {
      console.log(`Error fetching ${weightClass}lbs: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch content using Playwright for JavaScript-rendered pages
   */
  async _fetchWithPlaywright(url, weightClass) {
    return await this.fetchDynamic(url, {
      waitTime: 3000,
      waitForSelector: 'div[data-test="ranking-content"]',
      timeout: 30000
    });
  }

  /**
   * Parse FloWrestling rankings from HTML
   * Supports both static and Playwright-rendered content
   */
  _parseRankings($, weightClass) {
    const wrestlers = [];

    // Method 1: Look for structured data container (Playwright-rendered)
    const rankingContainer = $('div[data-test="ranking-content"]');

    if (rankingContainer.length > 0) {
      return this._parseRankingTable(rankingContainer, $, weightClass);
    }

    // Method 2: Try to find JSON-LD structured data
    const jsonLdWrestlers = this._parseJsonLd($, weightClass);
    if (jsonLdWrestlers.length > 0) {
      return jsonLdWrestlers;
    }

    // Method 3: Try to find embedded JSON data in script tags
    const embeddedJsonWrestlers = this._parseEmbeddedJson($, weightClass);
    if (embeddedJsonWrestlers.length > 0) {
      return embeddedJsonWrestlers;
    }

    // Method 4: Fallback to HTML structure parsing
    return this._parseHtmlStructure($, weightClass);
  }

  /**
   * Parse ranking table (typical Playwright-rendered structure)
   */
  _parseRankingTable(container, $, weightClass) {
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

          wrestlers.push(this.normalizeWrestler({
            rank,
            name,
            school,
            weight_class: weightClass,
            source: `FloWrestling (${this.edition})`,
            grade,
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
   */
  _parseJsonLd($, weightClass) {
    const wrestlers = [];

    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const data = JSON.parse($(elem).html());
        if (data.itemListElement) {
          data.itemListElement.forEach(item => {
            if (item.name && item.position) {
              wrestlers.push(this.normalizeWrestler({
                rank: item.position,
                name: item.name,
                school: item.affiliation || 'Unknown',
                weight_class: weightClass,
                source: `FloWrestling (${this.edition})`
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
   */
  _parseEmbeddedJson($, weightClass) {
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
                  wrestlers.push(this.normalizeWrestler({
                    rank: wrestlers.length + 1,
                    name: athleteData.name,
                    school: athleteData.school || athleteData.team || 'Unknown',
                    weight_class: weightClass,
                    source: `FloWrestling (${this.edition})`
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
   */
  _parseHtmlStructure($, weightClass) {
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
        wrestlers.push(this.normalizeWrestler({
          rank: i + 1,
          name: match[1].trim(),
          school: match[2].trim(),
          weight_class: weightClass,
          source: `FloWrestling (${this.edition})`
        }));
        return;
      }

      // Pattern: "Rank. Name School"
      match = text.match(/(\d+)\.\s*([A-Za-z\s]+?)\s+([A-Za-z\s]+)$/);
      if (match) {
        wrestlers.push(this.normalizeWrestler({
          rank: parseInt(match[1]),
          name: match[2].trim(),
          school: match[3].trim(),
          weight_class: weightClass,
          source: `FloWrestling (${this.edition})`
        }));
      }
    });

    return wrestlers;
  }
}

export default FlowWrestlingScraper;
