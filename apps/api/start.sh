#!/bin/sh
set -e

echo "🚀 Starting PULSE API..."

# Resolve any failed migrations first
echo "🔍 Checking for failed migrations..."
FAILED_MIGRATION="20260207140000_add_team_sla_escalation"
if npx prisma migrate status 2>&1 | grep -q "failed"; then
    echo "⚠️  Found failed migration, resolving..."
    npx prisma migrate resolve --applied "$FAILED_MIGRATION" || true
fi

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Fix schema - add any missing columns/tables from failed migration
echo "🔧 Applying schema fixes..."
if [ -f "scripts/fix-schema.sql" ]; then
    psql "$DATABASE_URL" -f scripts/fix-schema.sql || echo "Schema fix already applied or not needed"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database with admin user (uses upsert, safe to run multiple times)
echo "🌱 Seeding database..."
npm run db:seed

# Start the application
echo "✅ Starting server..."
exec node dist/index.js
