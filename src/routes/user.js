import express from 'express';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { User, APIUsage } from '../database.js';
import { verifyApiKey } from '../middleware/auth.js';
// import Stripe from 'stripe'; // Uncomment when integrating with Stripe
// import { config } from '../config.js';

const router = express.Router();

// Rate limiter for signup endpoint to prevent abuse and enumeration attacks
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 signup requests per windowMs
  message: { detail: 'Too many signup attempts from this IP, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// POST /api/v1/signup - Create new user account
router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ detail: 'Email is required' });
    }

    // Check if email exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ detail: 'Email already exists' });
    }

    // Generate API key
    const api_key = uuidv4();
    const user = await User.create({
      email,
      api_key,
      plan: 'free'
    });

    // TODO: Integrate Stripe checkout session for paid plans
    // const stripe = new Stripe(config.STRIPE_API_KEY);
    // await stripe.customers.create({ email });

    res.status(201).json({
      email: user.email,
      api_key: user.api_key,
      plan: user.plan,
      message: '⚠️  IMPORTANT: Save your API key securely. It will not be shown again. If lost, you must regenerate it via /api/v1/user/regenerate-key'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /api/v1/user - Delete user account (authenticated)
router.delete('/user', verifyApiKey, async (req, res) => {
  try {
    // Authorization: Users can only delete their own account
    // req.user is set by verifyApiKey middleware
    const user = req.user;

    // Delete associated API usage records
    await APIUsage.destroy({ where: { user_id: user.id } });

    // Delete user
    await user.destroy();

    res.json({
      message: `User ${user.email} and all associated data deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/v1/user - Get user information (authenticated)
router.get('/user', verifyApiKey, async (req, res) => {
  try {
    // Authorization: Users can only access their own account
    // req.user is set by verifyApiKey middleware
    const user = req.user;

    // Get usage stats
    const usage = await APIUsage.findAll({ where: { user_id: user.id } });
    const total_requests = usage.reduce((sum, u) => sum + u.requests, 0);

    res.json({
      email: user.email,
      plan: user.plan,
      total_requests
      // Note: api_key is NOT returned for security
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/v1/user/regenerate-key - Regenerate API key (authenticated)
router.post('/user/regenerate-key', verifyApiKey, async (req, res) => {
  try {
    // Authorization: User regenerates their own API key
    // req.user is set by verifyApiKey middleware
    const user = req.user;

    // Generate new API key
    const new_api_key = uuidv4();
    user.api_key = new_api_key;
    await user.save();

    res.json({
      message: 'API key regenerated successfully',
      api_key: new_api_key,
      email: user.email,
      warning: '⚠️  Your old API key is now invalid. Update all applications using the old key.'
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
