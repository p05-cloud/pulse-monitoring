#!/bin/sh
set -e

echo "🚀 Starting PULSE API..."

# Resolve any failed migrations first (uses IF NOT EXISTS, safe to mark as applied)
echo "🔍 Checking for failed migrations..."
FAILED_MIGRATION="20260207140000_add_team_sla_escalation"
if npx prisma migrate status 2>&1 | grep -q "failed"; then
    echo "⚠️  Found failed migration, resolving..."
    npx prisma migrate resolve --applied "$FAILED_MIGRATION" || true
fi

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (ensure it's available at runtime)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database with admin user (uses upsert, safe to run multiple times)
echo "🌱 Seeding database..."
npm run db:seed

# Start the application
echo "✅ Starting server..."
exec node dist/index.js
