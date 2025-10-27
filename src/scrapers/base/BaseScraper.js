import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

/**
 * Base scraper utilities with common functionality for all wrestling data sources
 */

/**
 * Create an axios instance with common configuration
 * @param {Object} options - Configuration options
 * @returns {AxiosInstance} Configured axios instance
 */
export function createAxiosInstance(options = {}) {
  return axios.create({
    headers: {
      'User-Agent': options.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    timeout: options.timeout || 15000
  });
}

/**
 * Fetch HTML content using axios (for static pages)
 * @param {string} url - URL to fetch
 * @param {Object} options - Configuration options
 * @returns {Promise<CheerioAPI|null>} Cheerio instance or null
 */
export async function fetchStatic(url, options = {}) {
  try {
    const axiosInstance = createAxiosInstance(options);
    const response = await axiosInstance.get(url);
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
 * @param {string} url - URL to fetch
 * @param {Object} options - Configuration options
 * @returns {Promise<CheerioAPI|null>} Cheerio instance or null
 */
export async function fetchDynamic(url, options = {}) {
  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

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
    await browser.close();

    return cheerio.load(content);
  } catch (error) {
    console.error(`Error fetching dynamic content from ${url}: ${error.message}`);
    if (browser) {
      await browser.close();
    }
    return null;
  }
}

/**
 * Create a browser instance for multiple page fetches
 * @returns {Promise<Browser>} Playwright browser instance
 */
export async function createBrowser() {
  return await chromium.launch({ headless: true });
}

/**
 * Fetch HTML content using an existing browser instance
 * @param {Browser} browser - Playwright browser instance
 * @param {string} url - URL to fetch
 * @param {Object} options - Configuration options
 * @returns {Promise<CheerioAPI|null>} Cheerio instance or null
 */
export async function fetchDynamicWithBrowser(browser, url, options = {}) {
  try {
    const page = await browser.newPage();

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
 * Add delay between requests to be respectful to servers
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export function delay(ms = 500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Normalize wrestler data structure
 * @param {Object} data - Raw wrestler data
 * @param {string} sourceName - Name of the source
 * @returns {Object} Normalized wrestler object
 */
export function normalizeWrestler(data, sourceName = 'Unknown') {
  return {
    rank: data.rank || null,
    name: data.name || 'Unknown',
    school: data.school || 'Unknown',
    weight_class: String(data.weight_class || 'Unknown'),
    source: data.source || sourceName,
    grade: data.grade || null,
    previous_rank: data.previous_rank || null,
    record: data.record || null,
    ...data.extra
  };
}

// Default export for backward compatibility
export default {
  createAxiosInstance,
  fetchStatic,
  fetchDynamic,
  createBrowser,
  fetchDynamicWithBrowser,
  delay,
  normalizeWrestler
};
