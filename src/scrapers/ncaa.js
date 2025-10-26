import axios from 'axios';
import * as cheerio from 'cheerio';

export class NCAAScraper {
  /**
   * Scraper for NCAA wrestling rankings.
   * Note: Many wrestling sites use JavaScript rendering.
   * This implementation tries multiple sources and fallback strategies.
   * For JS-rendered sites, use the PlaywrightScraper class.
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

  constructor() {
    this.axiosInstance = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 15000
    });
  }

  /**
   * Fetch wrestler rankings from multiple sources.
   * Returns a list of wrestler objects with rank, name, school, weight_class, and source.
   */
  async fetchRankings() {
    let wrestlers = [];

    // Try FloWrestling weight class pages
    try {
      const flowWrestlers = await this._fetchFlowrestlingWeightClasses();
      if (flowWrestlers && flowWrestlers.length > 0) {
        wrestlers = wrestlers.concat(flowWrestlers);
        return wrestlers;
      }
    } catch (error) {
      console.log(`FloWrestling weight class scraping failed: ${error.message}`);
    }

    // Try NCAA.com
    try {
      const ncaaWrestlers = await this._fetchNcaaRankings();
      if (ncaaWrestlers && ncaaWrestlers.length > 0) {
        wrestlers = wrestlers.concat(ncaaWrestlers);
        return wrestlers;
      }
    } catch (error) {
      console.log(`NCAA.com failed: ${error.message}`);
    }

    // If all sources fail, return empty list
    console.log("All ranking sources failed.");
    return wrestlers;
  }

  async _fetchFlowrestlingWeightClasses() {
    const wrestlers = [];

    for (const [weightClass, url] of Object.entries(NCAAScraper.WEIGHT_CLASS_URLS)) {
      try {
        console.log(`Scraping ${weightClass}lbs from FloWrestling...`);
        const response = await this.axiosInstance.get(url);

        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          const weightWrestlers = this._parseFlowrestlingWeightPage($, weightClass);
          wrestlers.push(...weightWrestlers);
          console.log(`✓ Found ${weightWrestlers.length} wrestlers at ${weightClass}lbs`);
        } else {
          console.log(`⚠️  Failed to fetch ${weightClass}lbs (Status: ${response.status})`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`❌ Error fetching ${weightClass}lbs: ${error.message}`);
        continue;
      }
    }

    return wrestlers;
  }

  _parseFlowrestlingWeightPage($, weightClass) {
    const wrestlers = [];

    // Try to find JSON-LD structured data
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const data = JSON.parse($(elem).html());
        if (data.itemListElement) {
          data.itemListElement.forEach(item => {
            if (item.name && item.position) {
              wrestlers.push({
                rank: item.position,
                name: item.name,
                school: item.affiliation || 'Unknown',
                weight_class: weightClass,
                source: 'FloWrestling'
              });
            }
          });
        }
      } catch (error) {
        // Skip invalid JSON
      }
    });

    if (wrestlers.length > 0) {
      return wrestlers;
    }

    // Try to find embedded JSON data in script tags
    $('script').each((i, elem) => {
      const scriptText = $(elem).html();
      if (scriptText && scriptText.toLowerCase().includes('ranking') && scriptText.toLowerCase().includes('athlete')) {
        try {
          // Find JSON objects that might contain athlete data
          const jsonMatches = scriptText.match(/\{[^{}]*"name"[^{}]*\}/g);
          if (jsonMatches) {
            jsonMatches.forEach(match => {
              try {
                const athleteData = JSON.parse(match);
                if (athleteData.name) {
                  wrestlers.push({
                    rank: wrestlers.length + 1,
                    name: athleteData.name || 'Unknown',
                    school: athleteData.school || athleteData.team || 'Unknown',
                    weight_class: weightClass,
                    source: 'FloWrestling'
                  });
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

    if (wrestlers.length > 0) {
      return wrestlers;
    }

    // Fallback: Try to parse HTML structure
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
        wrestlers.push({
          rank: i + 1,
          name: match[1].trim(),
          school: match[2].trim(),
          weight_class: weightClass,
          source: 'FloWrestling'
        });
        return;
      }

      // Pattern: "Rank. Name School"
      match = text.match(/(\d+)\.\s*([A-Za-z\s]+?)\s+([A-Za-z\s]+)$/);
      if (match) {
        wrestlers.push({
          rank: parseInt(match[1]),
          name: match[2].trim(),
          school: match[3].trim(),
          weight_class: weightClass,
          source: 'FloWrestling'
        });
      }
    });

    return wrestlers;
  }

  async _fetchNcaaRankings() {
    const url = "https://www.ncaa.com/rankings/wrestling/d1";
    const response = await this.axiosInstance.get(url);

    if (response.status !== 200) {
      return [];
    }

    const $ = cheerio.load(response.data);
    const wrestlers = [];

    // Look for ranking tables
    $('table.rankings, table.table').each((i, table) => {
      $(table).find('tr').slice(1).each((j, row) => {
        const cols = $(row).find('td, th');
        if (cols.length >= 3) {
          try {
            const rank = parseInt($(cols[0]).text().trim());
            const name = $(cols[1]).text().trim();
            const school = cols.length > 2 ? $(cols[2]).text().trim() : 'Unknown';
            const weight = cols.length > 3 ? $(cols[3]).text().trim() : 'Unknown';

            wrestlers.push({
              rank,
              name,
              school,
              weight_class: weight,
              source: 'NCAA.com'
            });
          } catch (error) {
            // Skip invalid rows
          }
        }
      });
    });

    return wrestlers;
  }

  async fetchRankingsByWeight(weightClass) {
    const weightClassStr = String(weightClass);
    if (NCAAScraper.WEIGHT_CLASS_URLS[weightClassStr]) {
      try {
        const url = NCAAScraper.WEIGHT_CLASS_URLS[weightClassStr];
        const response = await this.axiosInstance.get(url);

        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          const wrestlers = this._parseFlowrestlingWeightPage($, weightClassStr);
          if (wrestlers.length > 0) {
            return wrestlers;
          }
        }
      } catch (error) {
        console.log(`Error fetching ${weightClass}lbs specifically: ${error.message}`);
      }
    }

    // Fallback to getting all rankings and filtering
    const allRankings = await this.fetchRankings();
    return allRankings.filter(w => w.weight_class === weightClassStr);
  }
}

export default NCAAScraper;
