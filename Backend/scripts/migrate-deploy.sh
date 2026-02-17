#!/bin/sh
# Prisma migration script with retry logic for NeonDB

set -e

MAX_RETRIES=3
RETRY_DELAY=5
TIMEOUT=30000  # 30 seconds

echo "🔄 Starting Prisma migrations..."

for i in $(seq 1 $MAX_RETRIES); do
  echo "📦 Attempt $i of $MAX_RETRIES..."
  
  # Run migration with increased timeout
  PRISMA_MIGRATE_DEPLOY_TIMEOUT=$TIMEOUT npx prisma migrate deploy --skip-generate || {
    if [ $i -eq $MAX_RETRIES ]; then
      echo "❌ Migration failed after $MAX_RETRIES attempts"
      echo "⚠️  Continuing deployment - migrations may already be applied"
      exit 0  # Don't fail deployment - migrations might already be applied
    fi
    echo "⏳ Waiting ${RETRY_DELAY}s before retry..."
    sleep $RETRY_DELAY
  } && {
    echo "✅ Migrations completed successfully"
    exit 0
  }
done

echo "⚠️  Migrations timed out but continuing deployment"
exit 0




