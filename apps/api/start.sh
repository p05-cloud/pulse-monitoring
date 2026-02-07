#!/bin/sh
set -e

echo "🚀 Starting PULSE API..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Apply performance indexes (ignore errors if already exist)
echo "📊 Applying performance indexes..."
psql $DATABASE_URL -f scripts/add-indexes.sql || echo "⚠️  Index script failed (may already exist)"

# Start the application
echo "✅ Starting server..."
exec node dist/index.js
