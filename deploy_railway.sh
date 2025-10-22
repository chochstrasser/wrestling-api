#!/bin/bash
# Quick deployment script for Railway

echo "🚀 Deploying Wrestling API to Railway"
echo "======================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit"
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Or use the Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Click 'New Project'"
    echo "  3. Select 'Deploy from GitHub repo'"
    echo "  4. Connect your GitHub account"
    echo "  5. Select this repository"
    echo ""
    exit 1
fi

echo "🔐 Logging into Railway..."
railway login

echo ""
echo "📦 Initializing Railway project..."
railway init

echo ""
echo "🗄️  Adding PostgreSQL database..."
railway add --plugin postgresql

echo ""
echo "⚙️  Setting environment variables..."
echo "Enter your Stripe API key (or press Enter to skip):"
read -r stripe_key
if [ -n "$stripe_key" ]; then
    railway variables set STRIPE_API_KEY="$stripe_key"
fi

echo "Enter your Stripe webhook secret (or press Enter to skip):"
read -r stripe_secret
if [ -n "$stripe_secret" ]; then
    railway variables set STRIPE_WEBHOOK_SECRET="$stripe_secret"
fi

echo ""
echo "🚀 Deploying application..."
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Import wrestler data:"
echo "   railway run python import_csv.py wrestlers_sample.csv"
echo ""
echo "2. Get your public URL:"
echo "   railway domain"
echo ""
echo "3. Test your API:"
echo "   railway run python -c \"import requests; print(requests.get('https://YOUR-URL.railway.app/').json())\""
echo ""
echo "📊 View logs:"
echo "   railway logs"
echo ""
echo "🌐 Open in browser:"
echo "   railway open"
echo ""
