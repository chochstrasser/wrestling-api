import express from 'express';
import { createScraper, getAvailableEditions } from '../scrapers/index.js';
import { Wrestler } from '../database.js';
import { verifyApiKey } from '../middleware/auth.js';

const router = express.Router();

// POST /api/v1/scraper/run - Trigger the scraper to populate database
router.post('/scraper/run', verifyApiKey, async (req, res) => {
  try {
    const {
      usePlaywright = true,
      clearExisting = true,
      source = 'flowrestling',
      edition = 'current'
    } = req.body;

    console.log(`Starting scraper (source: ${source}, edition: ${edition}, Playwright: ${usePlaywright})...`);

    // Create scraper based on request
    const scraper = createScraper(source, {
      usePlaywright,
      edition
    });

    const scraperType = usePlaywright ? 'Playwright' : 'Static';

    // Fetch rankings
    const rankings = await scraper.fetchRankings();

    if (rankings.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No rankings found. The websites may be using JavaScript rendering.',
        scraperType,
        suggestion: usePlaywright
          ? 'Try checking if Playwright is properly configured'
          : 'Try using Playwright scraper: POST with {"usePlaywright": true}'
      });
    }

    // Clear existing data if requested
    if (clearExisting) {
      const existingCount = await Wrestler.count();
      if (existingCount > 0) {
        console.log(`Clearing ${existingCount} existing records...`);
        await Wrestler.destroy({ where: {}, truncate: true });
      }
    }

    // Add new rankings using upsert to prevent duplicates
    const wrestlersToAdd = rankings.map(item => ({
      name: item.name || 'Unknown',
      school: item.school || 'Unknown',
      weight_class: item.weight_class || 'Unknown',
      rank: item.rank || 0,
      source: item.source || 'NCAA',
      last_updated: new Date()
    }));

    // Use bulkCreate with updateOnDuplicate to handle duplicates
    // This will update existing records if they match on the unique constraint (name, weight_class, source)
    await Wrestler.bulkCreate(wrestlersToAdd, {
      updateOnDuplicate: ['school', 'rank', 'last_updated'],
      ignoreDuplicates: false
    });

    const finalCount = await Wrestler.count();

    res.json({
      success: true,
      message: 'Scraper completed successfully',
      scraperType,
      source,
      edition,
      rankingsFound: rankings.length,
      recordsAdded: wrestlersToAdd.length,
      totalInDatabase: finalCount,
      clearedExisting: clearExisting
    });
  } catch (error) {
    console.error('Error running scraper:', error);
    res.status(500).json({
      success: false,
      detail: 'Failed to run scraper',
      error: error.message
    });
  }
});

// GET /api/v1/scraper/status - Check scraper health
router.get('/scraper/status', verifyApiKey, async (req, res) => {
  try {
    const wrestlerCount = await Wrestler.count();
    const weightClasses = await Wrestler.findAll({
      attributes: ['weight_class'],
      group: ['weight_class']
    });

    const availableEditions = getAvailableEditions();

    res.json({
      databasePopulated: wrestlerCount > 0,
      totalWrestlers: wrestlerCount,
      weightClassesAvailable: weightClasses.map(w => w.weight_class),
      playwrightAvailable: true,
      availableEditions,
      supportedSources: ['flowrestling', 'ncaa', 'ncaa-legacy', 'playwright-legacy']
    });
  } catch (error) {
    console.error('Error checking scraper status:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
