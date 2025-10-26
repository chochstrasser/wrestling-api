import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { User, APIUsage } from '../database.js';
// import Stripe from 'stripe'; // Uncomment when integrating with Stripe
// import { config } from '../config.js';

const router = express.Router();

// POST /api/v1/signup - Create new user account
router.post('/signup', async (req, res) => {
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

    res.json({
      email: user.email,
      api_key: user.api_key,
      plan: user.plan
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /api/v1/user - Delete user account
router.delete('/user', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ detail: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Delete associated API usage records
    await APIUsage.destroy({ where: { user_id: user.id } });

    // Delete user
    await user.destroy();

    res.json({
      message: `User ${email} and all associated data deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/v1/user - Get user information
router.get('/user', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ detail: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Get usage stats
    const usage = await APIUsage.findAll({ where: { user_id: user.id } });
    const total_requests = usage.reduce((sum, u) => sum + u.requests, 0);

    res.json({
      email: user.email,
      api_key: user.api_key,
      plan: user.plan,
      total_requests
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
