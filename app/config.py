import os
from dotenv import load_dotenv
load_dotenv()

# Stripe
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Free tier limit
FREE_TIER_LIMIT = 500  # requests per month
