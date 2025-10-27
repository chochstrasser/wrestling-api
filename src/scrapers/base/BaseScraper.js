import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

/**
 * Base scraper class with common functionality for all wrestling data sources
 */
export class BaseScraper {
  constructor(options = {}) {
    this.axiosInstance = axios.create({
      headers: {
        'User-Agent': options.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: options.timeout || 15000
    });

    this.usePlaywright = options.usePlaywright || false;
    this.browser = null;
  }

  /**
   * Fetch HTML content using axios (for static pages)
   */
  async fetchStatic(url) {
    try {
      const response = await this.axiosInstance.get(url);
      if (response.status === 200) {
        return cheerio.load(response.data);
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch HTML content using Playwright (for JS-rendered pages)
   */
  async fetchDynamic(url, options = {}) {
    try {
      if (!this.browser) {
        this.browser = await chromium.launch({ headless: true });
      }

      const page = await this.browser.newPage();
      await page.goto(url, {
        waitUntil: options.waitUntil || 'domcontentloaded',
        timeout: options.timeout || 30000
      });

      // Wait for content to load
      if (options.waitTime) {
        await page.waitForTimeout(options.waitTime);
      }

      // Optionally wait for a selector
      if (options.waitForSelector) {
        try {
          await page.waitForSelector(options.waitForSelector, { timeout: 5000 });
        } catch (error) {
          console.log(`Warning: Selector ${options.waitForSelector} not found`);
        }
      }

      const content = await page.content();
      await page.close();

      return cheerio.load(content);
    } catch (error) {
      console.error(`Error fetching dynamic content from ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Close browser if using Playwright
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Add delay between requests to be respectful to servers
   */
  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Normalize wrestler data structure
   */
  normalizeWrestler(data) {
    return {
      rank: data.rank || null,
      name: data.name || 'Unknown',
      school: data.school || 'Unknown',
      weight_class: String(data.weight_class || 'Unknown'),
      source: data.source || this.constructor.name,
      grade: data.grade || null,
      previous_rank: data.previous_rank || null,
      record: data.record || null,
      ...data.extra
    };
  }

  /**
   * Template method for fetching rankings - to be implemented by subclasses
   */
  async fetchRankings() {
    throw new Error('fetchRankings must be implemented by subclass');
  }

  /**
   * Template method for fetching rankings by weight class
   */
  async fetchRankingsByWeight(weightClass) {
    throw new Error('fetchRankingsByWeight must be implemented by subclass');
  }
}

export default BaseScraper;
