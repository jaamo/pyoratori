FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create uploads directory owned by nextjs user
RUN mkdir -p /app/uploads/original /app/uploads/optimized && \
    chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

# Worker stage for cron jobs
FROM base AS worker
WORKDIR /app

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY src/scripts ./src/scripts
COPY src/server ./src/server
COPY src/lib ./src/lib
COPY src/types ./src/types
COPY tsconfig.json drizzle.config.ts package.json ./

# Create log directory
RUN mkdir -p /var/log/cron

# Copy cron files
COPY cron/crontab /etc/crontabs/root
COPY cron/run-script.sh /app/cron/run-script.sh
RUN chmod +x /app/cron/run-script.sh

# Entrypoint dumps env vars then starts crond
COPY cron/entrypoint.sh /app/cron/entrypoint.sh
RUN chmod +x /app/cron/entrypoint.sh

ENTRYPOINT ["/app/cron/entrypoint.sh"]
