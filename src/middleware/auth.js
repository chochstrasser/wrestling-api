import { User, APIUsage } from '../database.js';
import { config } from '../config.js';
import { Op } from 'sequelize';

export async function verifyApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ detail: 'API key required' });
    }

    // Find user by API key
    const user = await User.findOne({
      where: { api_key: apiKey }
    });

    if (!user) {
      return res.status(401).json({ detail: 'Invalid API key' });
    }

    // Usage tracking (monthly)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let usage = await APIUsage.findOne({
      where: {
        user_id: user.id,
        date: {
          [Op.gte]: monthStart
        }
      }
    });

    if (!usage) {
      // Create new usage record for this month
      usage = await APIUsage.create({
        user_id: user.id,
        requests: 1,
        date: now
      });
    } else {
      // Check if user is on free tier and has exceeded limit
      if (user.plan === 'free' && usage.requests >= config.FREE_TIER_LIMIT) {
        return res.status(429).json({
          detail: `Free tier limit of ${config.FREE_TIER_LIMIT} requests per month reached`
        });
      }

      // Increment request count
      usage.requests += 1;
      await usage.save();
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}
