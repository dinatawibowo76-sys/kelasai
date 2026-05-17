# ============================================
# KelasAI Production Dockerfile
# Multi-stage build for minimal image size
# ============================================

# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps

# Install bun
RUN npm install -g bun

# Copy package files first (better layer caching)
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies — fallback from frozen lockfile to regular install
RUN if [ -f bun.lock ]; then \
      bun install --frozen-lockfile 2>/dev/null || bun install; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    else \
      bun install; \
    fi

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# ---- Builder ----
FROM base AS deps-builder

# Install bun for build step
RUN npm install -g bun

# Re-install deps from scratch (clean copy without .cache artifacts)
COPY package.json bun.lock* package-lock.json* ./
RUN if [ -f bun.lock ]; then \
      bun install --frozen-lockfile 2>/dev/null || bun install; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    else \
      bun install; \
    fi

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# Set dummy env vars for build (overridden at runtime)
ENV DATABASE_URL=file:/app/db/custom.db
ENV NEXTAUTH_SECRET=build-secret-not-for-production
ENV NEXTAUTH_URL=http://localhost:3000
ENV SKIP_ENV_VALIDATION=1

# Build the Next.js application
RUN bun run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server output
COPY --from=deps-builder /app/.next/standalone ./
COPY --from=deps-builder /app/.next/static ./.next/static
COPY --from=deps-builder /app/public ./public

# Copy Prisma files needed at runtime (for prisma db push in entrypoint)
COPY --from=deps-builder /app/prisma ./prisma
COPY --from=deps-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps-builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create persistent data directories and set ownership
RUN mkdir -p /app/db /app/upload && \
    chown -R nextjs:nodejs /app/db /app/upload /app/prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
