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

export default router;
