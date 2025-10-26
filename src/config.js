import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Stripe configuration
  STRIPE_API_KEY: process.env.STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Rate limiting
  FREE_TIER_LIMIT: 500, // requests per month

  // Server configuration
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite:wrestling_api.db'
};

export default config;
