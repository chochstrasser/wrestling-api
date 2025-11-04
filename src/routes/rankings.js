import express from 'express';
import { Wrestler } from '../database.js';
import { verifyApiKey } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/rankings - Get wrestler rankings
router.get('/rankings', verifyApiKey, async (req, res) => {
  try {
    const { weight_class } = req.query;

    const whereClause = weight_class ? { weight_class } : {};

    const wrestlers = await Wrestler.findAll({
      where: whereClause,
      order: [['rank', 'ASC']]
    });

    res.json(wrestlers);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/v1/rankings - Create or update a wrestler
router.post('/rankings', verifyApiKey, async (req, res) => {
  try {
    const { name, school, weight_class, rank, grade, source } = req.body;

    // Validate required fields
    if (!name || !school || !weight_class || !rank) {
      return res.status(400).json({
        detail: 'Missing required fields: name, school, weight_class, rank'
      });
    }

    // Validate grade if provided
    if (grade && !['FR', 'SO', 'JR', 'SR'].includes(grade)) {
      return res.status(400).json({
        detail: 'Invalid grade. Must be one of: FR, SO, JR, SR'
      });
    }

    // Create or update wrestler (upsert based on unique constraint)
    const [wrestler, created] = await Wrestler.upsert({
      name,
      school,
      weight_class: String(weight_class),
      rank: parseInt(rank),
      grade: grade || null,
      source: source || 'Manual API'
    }, {
      returning: true
    });

    res.status(created ? 201 : 200).json(wrestler);
  } catch (error) {
    console.error('Error creating/updating wrestler:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/v1/rankings/bulk - Bulk create or update wrestlers
router.post('/rankings/bulk', verifyApiKey, async (req, res) => {
  try {
    const { wrestlers } = req.body;

    if (!Array.isArray(wrestlers) || wrestlers.length === 0) {
      return res.status(400).json({
        detail: 'Request body must contain a "wrestlers" array with at least one wrestler'
      });
    }

    // Validate all wrestlers
    for (const wrestler of wrestlers) {
      if (!wrestler.name || !wrestler.school || !wrestler.weight_class || !wrestler.rank) {
        return res.status(400).json({
          detail: 'Each wrestler must have: name, school, weight_class, rank'
        });
      }
      if (wrestler.grade && !['FR', 'SO', 'JR', 'SR'].includes(wrestler.grade)) {
        return res.status(400).json({
          detail: `Invalid grade for ${wrestler.name}. Must be one of: FR, SO, JR, SR`
        });
      }
    }

    // Bulk create/update
    const results = await Promise.all(
      wrestlers.map(w =>
        Wrestler.upsert({
          name: w.name,
          school: w.school,
          weight_class: String(w.weight_class),
          rank: parseInt(w.rank),
          grade: w.grade || null,
          source: w.source || 'Manual API'
        }, {
          returning: true
        })
      )
    );

    const created = results.filter(([_, wasCreated]) => wasCreated).length;
    const updated = results.length - created;

    res.status(200).json({
      message: `Successfully processed ${results.length} wrestlers`,
      created,
      updated
    });
  } catch (error) {
    console.error('Error bulk creating/updating wrestlers:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
