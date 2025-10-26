import express from 'express';
import { PlaywrightScraper } from '../scrapers/playwright.js';
import { NCAAScraper } from '../scrapers/ncaa.js';
import { Wrestler } from '../database.js';
import { verifyApiKey } from '../middleware/auth.js';

const router = express.Router();

// POST /api/v1/scraper/run - Trigger the scraper to populate database
router.post('/scraper/run', verifyApiKey, async (req, res) => {
  try {
    const { usePlaywright = true, clearExisting = true } = req.body;

    console.log(`Starting scraper (Playwright: ${usePlaywright})...`);

    // Choose scraper based on request
    let scraper;
    let scraperType;

    if (usePlaywright) {
      scraper = new PlaywrightScraper();
      scraperType = 'Playwright';
    } else {
      scraper = new NCAAScraper();
      scraperType = 'Basic';
    }

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

    // Add new rankings
    const wrestlersToAdd = rankings.map(item => ({
      name: item.name || 'Unknown',
      school: item.school || 'Unknown',
      weight_class: item.weight_class || 'Unknown',
      rank: item.rank || 0,
      source: item.source || 'NCAA'
    }));

    await Wrestler.bulkCreate(wrestlersToAdd);

    const finalCount = await Wrestler.count();

    res.json({
      success: true,
      message: 'Scraper completed successfully',
      scraperType,
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

    res.json({
      databasePopulated: wrestlerCount > 0,
      totalWrestlers: wrestlerCount,
      weightClassesAvailable: weightClasses.map(w => w.weight_class),
      playwrightAvailable: true // Will be true if dependencies are installed
    });
  } catch (error) {
    console.error('Error checking scraper status:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
