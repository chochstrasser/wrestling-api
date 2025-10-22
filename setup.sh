#!/bin/bash
# Quick setup script for Wrestling API

set -e

echo "🤼 Wrestling API Setup"
echo "====================="
echo ""

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL=sqlite:///./wrestling_api.db

# Stripe Configuration (add your actual keys when ready)
STRIPE_API_KEY=your_stripe_api_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Initialize database
echo "🗄️  Initializing database..."
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine); print('✅ Database initialized')"

# Check if data exists
echo "📊 Checking for wrestler data..."
COUNT=$(python -c "from app.database import SessionLocal; from app.models import Wrestler; db = SessionLocal(); print(db.query(Wrestler).count()); db.close()")

if [ "$COUNT" -eq 0 ]; then
    echo "⚠️  No wrestler data found"
    echo ""
    echo "Would you like to create sample data? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        python import_csv.py create
        python import_csv.py wrestlers_sample.csv << EOF
n
EOF
        echo "✅ Sample data imported"
    fi
else
    echo "✅ Found $COUNT wrestlers in database"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the server: uvicorn app.main:app --reload"
echo "2. Visit: http://127.0.0.1:8000/docs"
echo "3. Sign up for an API key: POST /api/v1/signup"
echo ""
echo "To import custom data:"
echo "  python import_csv.py your_rankings.csv"
echo ""
