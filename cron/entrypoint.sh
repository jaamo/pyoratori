#!/bin/sh
# Save env vars for cron jobs
env | grep -E '^(DB_|AUTH_|OPENAI_|MJ_|NODE_|PATH=)' > /app/cron/env.sh
sed -i 's/^/export /' /app/cron/env.sh

mkdir -p /var/log/cron

# Start crond in foreground
exec crond -f -l 2
