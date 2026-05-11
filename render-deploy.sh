#!/usr/bin/env bash
set -euo pipefail

# Small Render deploy helper
# Usage: ./render-deploy.sh [--push]
#  --push   : commit any build changes and push to origin (optional)

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_DIR="$ROOT_DIR/Script/DataBase"

echo "➡️ Building backend in: $DB_DIR"
cd "$DB_DIR"

echo "📦 Installing dependencies..."
npm install --no-audit --no-fund

echo "🔧 Generating Prisma client..."
npx prisma generate --schema=./prisma/schema.prisma

echo "🚚 Running Prisma migrations (deploy)..."
if ! npx prisma migrate deploy --schema=./prisma/schema.prisma; then
  echo "⚠️  prisma migrate deploy failed. This may be expected if DATABASE_URL isn't available locally. Proceeding."
fi

echo "✅ Build steps finished."

if [ "${1-}" = "--push" ]; then
  echo "📤 Committing & pushing to git..."
  git add -A
  git commit -m "chore: prepare build for Render deploy $(date -u +'%Y-%m-%dT%H:%M:%SZ')" || echo "No changes to commit"
  git push
fi

echo "Next: push your branch to GitHub so Render can deploy (or open Render dashboard)."
