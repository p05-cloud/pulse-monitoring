#!/bin/bash

# PULSE API Verification Script
# Checks if all required components are configured correctly

echo "🔍 PULSE API Configuration Verification"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: package.json dependencies
echo "📦 Checking dependencies..."
if [ -f "package.json" ]; then
    if grep -q "nodemailer" package.json; then
        echo "  ✅ nodemailer found"
    else
        echo "  ❌ nodemailer missing - run: npm install nodemailer"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "pdfkit" package.json; then
        echo "  ✅ pdfkit found"
    else
        echo "  ⚠️  pdfkit missing (optional for PDF reports)"
        WARNINGS=$((WARNINGS + 1))
    fi

    if grep -q "exceljs" package.json; then
        echo "  ✅ exceljs found"
    else
        echo "  ⚠️  exceljs missing (optional for Excel reports)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ❌ package.json not found"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: .env file
echo ""
echo "⚙️  Checking environment configuration..."
if [ -f ".env" ]; then
    echo "  ✅ .env file exists"

    # Check critical env vars
    if grep -q "^DATABASE_URL=" .env; then
        echo "  ✅ DATABASE_URL configured"
    else
        echo "  ❌ DATABASE_URL missing"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "^JWT_SECRET=" .env; then
        if grep -q "change-this-in-production" .env; then
            echo "  ⚠️  JWT_SECRET still using default (change in production!)"
            WARNINGS=$((WARNINGS + 1))
        else
            echo "  ✅ JWT_SECRET configured"
        fi
    else
        echo "  ❌ JWT_SECRET missing"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "^SMTP_HOST=" .env; then
        if grep -q "smtp.example.com" .env || grep -q "your-email@gmail.com" .env; then
            echo "  ⚠️  SMTP settings still using example values"
            WARNINGS=$((WARNINGS + 1))
        else
            echo "  ✅ SMTP configured"
        fi
    else
        echo "  ⚠️  SMTP_HOST missing (email notifications won't work)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ❌ .env file not found - copy from .env.example"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: Docker services
echo ""
echo "🐳 Checking Docker services..."
if command -v docker-compose &> /dev/null; then
    # Check PostgreSQL
    if docker-compose ps 2>/dev/null | grep -q "pulse-postgres.*Up"; then
        echo "  ✅ PostgreSQL is running"

        # Test connection
        if PGPASSWORD=pulse_dev_password psql -h localhost -U pulse -d pulse -c "SELECT 1" &>/dev/null; then
            echo "  ✅ PostgreSQL connection successful"
        else
            echo "  ⚠️  PostgreSQL connection failed"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "  ❌ PostgreSQL is not running - run: docker-compose up -d"
        ERRORS=$((ERRORS + 1))
    fi

    # Check Redis
    if docker-compose ps 2>/dev/null | grep -q "pulse-redis.*Up"; then
        echo "  ✅ Redis is running"

        # Test connection
        if docker-compose exec -T redis redis-cli ping &>/dev/null; then
            echo "  ✅ Redis connection successful"
        else
            echo "  ⚠️  Redis connection failed"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "  ❌ Redis is not running - run: docker-compose up -d"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ⚠️  docker-compose not found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 4: Database migrations
echo ""
echo "🗄️  Checking database setup..."
if [ -d "prisma/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 prisma/migrations | wc -l)
    echo "  ✅ Found $MIGRATION_COUNT migrations"

    # Check if Prisma client is generated
    if [ -d "node_modules/.prisma/client" ]; then
        echo "  ✅ Prisma client generated"
    else
        echo "  ⚠️  Prisma client not generated - run: npx prisma generate"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ❌ No migrations found"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Database indexes
echo ""
echo "📊 Checking database indexes..."
if command -v psql &> /dev/null; then
    INDEX_COUNT=$(PGPASSWORD=pulse_dev_password psql -h localhost -U pulse -d pulse -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null | xargs)

    if [ -n "$INDEX_COUNT" ] && [ "$INDEX_COUNT" -gt 20 ]; then
        echo "  ✅ Found $INDEX_COUNT indexes (good performance)"
    elif [ -n "$INDEX_COUNT" ] && [ "$INDEX_COUNT" -gt 0 ]; then
        echo "  ⚠️  Only $INDEX_COUNT indexes found - run: psql -U pulse -d pulse -f scripts/add-indexes.sql"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "  ⚠️  No custom indexes found - run: psql -U pulse -d pulse -f scripts/add-indexes.sql"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ⚠️  psql not found - cannot check indexes"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 6: Node modules
echo ""
echo "📚 Checking installed packages..."
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules exists"

    # Check for critical packages
    if [ -d "node_modules/nodemailer" ]; then
        echo "  ✅ nodemailer installed"
    else
        echo "  ❌ nodemailer not installed - run: npm install"
        ERRORS=$((ERRORS + 1))
    fi

    if [ -d "node_modules/bullmq" ]; then
        echo "  ✅ bullmq installed"
    else
        echo "  ❌ bullmq not installed - run: npm install"
        ERRORS=$((ERRORS + 1))
    fi

    if [ -d "node_modules/pdfkit" ]; then
        echo "  ✅ pdfkit installed"
    else
        echo "  ⚠️  pdfkit not installed (PDF reports will fall back to CSV)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ❌ node_modules not found - run: npm install"
    ERRORS=$((ERRORS + 1))
fi

# Check 7: Key files exist
echo ""
echo "📁 Checking critical files..."
CRITICAL_FILES=(
    "src/index.ts"
    "src/app.ts"
    "src/config/database.ts"
    "src/config/redis.ts"
    "src/execution/workers/check.worker.ts"
    "src/execution/workers/notification.worker.ts"
    "src/execution/workers/report.worker.ts"
    "src/execution/workers/cleanup.worker.ts"
    "src/orchestration/scheduler/check.scheduler.ts"
    "src/orchestration/scheduler/report.scheduler.ts"
    "src/execution/notifiers/email.notifier.ts"
    "src/execution/notifiers/teams.notifier.ts"
    "src/director/reports/report.service.ts"
    "src/director/maintenance/maintenance.service.ts"
)

MISSING_FILES=0
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        :  # File exists, do nothing
    else
        echo "  ❌ Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo "  ✅ All critical files present"
fi

# Summary
echo ""
echo "========================================"
echo "📋 Verification Summary"
echo "========================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! System is ready."
    echo ""
    echo "🚀 To start the server:"
    echo "   npm run dev"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS warnings found (non-critical)"
    echo ""
    echo "System should work but some features may be limited."
    echo "Review warnings above for details."
    echo ""
    echo "🚀 To start the server:"
    echo "   npm run dev"
    echo ""
    exit 0
else
    echo "❌ $ERRORS errors found"
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  $WARNINGS warnings found"
    fi
    echo ""
    echo "Please fix the errors above before starting the server."
    echo ""
    echo "Quick fixes:"
    echo "  1. Run: npm install"
    echo "  2. Create .env from .env.example"
    echo "  3. Start Docker: docker-compose up -d"
    echo "  4. Run migrations: npx prisma migrate deploy"
    echo "  5. Apply indexes: psql -U pulse -d pulse -f scripts/add-indexes.sql"
    echo ""
    exit 1
fi
