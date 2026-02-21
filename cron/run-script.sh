#!/bin/sh
set -e
. /app/cron/env.sh
cd /app

case "$1" in
  import:fillaritori) SCRIPT="src/scripts/import-fillaritori.ts" ;;
  classify:product)   SCRIPT="src/scripts/classify-product.ts" ;;
  alerts:check)       SCRIPT="src/scripts/check-search-alerts.ts" ;;
  *) echo "Unknown script: $1"; exit 1 ;;
esac

echo "[$(date)] Running $1..."
npx tsx "$SCRIPT" 2>&1 | tee -a /proc/1/fd/1
echo "[$(date)] Finished $1"
