#!/bin/bash

# PULSE API Setup Script
# This script sets up the API server for first-time use

set -e  # Exit on error

echo "🚀 PULSE API Setup"
echo "=================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from apps/api directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1/5: Installing dependencies..."
npm install

# Step 2: Check if .env exists
echo ""
echo "⚙️  Step 2/5: Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found"
    if [ -f "../../.env.example" ]; then
        echo "📋 Copying .env.example to .env..."
        cp ../../.env.example .env
        echo "✅ Created .env file"
        echo "⚠️  IMPORTANT: Edit .env and configure:"
        echo "   - DATABASE_URL (if not using default Docker setup)"
        echo "   - SMTP_* settings for email notifications"
        echo "   - JWT_SECRET (change to a secure random value)"
    else
        echo "❌ Error: .env.example not found"
        exit 1
    fi
else
    echo "✅ .env file exists"
fi

# Step 3: Check Docker services
echo ""
echo "🐳 Step 3/5: Checking Docker services..."
if command -v docker-compose &> /dev/null; then
    echo "Checking PostgreSQL and Redis..."

    # Check if containers are running
    if docker-compose ps | grep -q "pulse-postgres.*Up"; then
        echo "✅ PostgreSQL is running"
    else
        echo "⚠️  PostgreSQL is not running"
        echo "Starting Docker services..."
        (cd ../.. && docker-compose up -d)
        sleep 5
    fi

    if docker-compose ps | grep -q "pulse-redis.*Up"; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running"
    fi
else
    echo "⚠️  docker-compose not found - make sure PostgreSQL and Redis are running"
fi

# Step 4: Run database migrations
echo ""
echo "🗄️  Step 4/5: Running database migrations..."
npx prisma generate
npx prisma migrate deploy

# Step 5: Apply performance indexes
echo ""
echo "📊 Step 5/5: Applying performance indexes..."
if command -v psql &> /dev/null; then
    echo "Running index creation script..."
    PGPASSWORD=pulse_dev_password psql -h localhost -U pulse -d pulse -f scripts/add-indexes.sql
    echo "✅ Indexes applied"
else
    echo "⚠️  psql not found - you'll need to run indexes manually:"
    echo "   psql -U pulse -d pulse -f scripts/add-indexes.sql"
fi

# Optional: Seed database
echo ""
read -p "Would you like to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npx tsx scripts/seed.ts
    echo "✅ Database seeded"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review and update .env file (especially SMTP settings)"
echo "   2. Run: npm run dev"
echo "   3. Visit: http://localhost:3001/health"
echo ""
echo "📧 Email Configuration:"
echo "   - Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=587"
echo "   - Outlook: SMTP_HOST=smtp-mail.outlook.com, SMTP_PORT=587"
echo "   - Custom: Update SMTP_* variables in .env"
echo ""
echo "🎯 Full system features:"
echo "   ✓ Check Scheduler: Every minute"
echo "   ✓ Report Scheduler: Hourly"
echo "   ✓ Cleanup Worker: Daily at 2 AM"
echo "   ✓ Incident Detection: 3-failure rule"
echo "   ✓ Notifications: Email, Teams, Webhook"
echo "   ✓ Reports: PDF, Excel, CSV"
echo "   ✓ Maintenance Windows: Active"
echo "   ✓ Data Retention: 7-day check history"
echo ""
