#!/bin/sh
# ============================================
# KelasAI Docker Entrypoint
# Runs database setup then starts the server
# ============================================

set -e

echo ""
echo "🚀 KelasAI Starting..."
echo "=============================="

# ---- Step 1: Generate Prisma Client ----
echo ""
echo "📦 Generating Prisma client..."
npx prisma generate

# ---- Step 2: Push database schema ----
echo ""
echo "🗄️  Pushing database schema..."
npx prisma db push --skip-generate 2>&1 || {
  echo "⚠️  Warning: prisma db push failed. The database may already be up to date,"
  echo "   or there may be a connection issue. Continuing startup..."
}

echo ""
echo "✅ Database setup complete"
echo ""

# ---- Step 3: Start the server ----
echo "🌐 Starting Next.js server on port $PORT..."
echo ""

exec "$@"
