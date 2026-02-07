#!/bin/sh
set -e

echo "🚀 Starting PULSE API..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (ensure it's available at runtime)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the application
echo "✅ Starting server..."
exec node dist/index.js
