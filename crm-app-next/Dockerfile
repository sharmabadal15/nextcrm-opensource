# =============================================================================
# Multi-stage Dockerfile for CRM Frontend (Next.js)
# =============================================================================

# --- Dependencies stage ---
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm approve-builds msw sharp unrs-resolver && \
    pnpm install --frozen-lockfile

# --- Builder stage ---
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Restore package.json with approved build scripts from deps stage
COPY --from=deps /app/package.json ./package.json

# Build-time env vars (override via docker-compose build args)
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_NAME="CRM Pro"
ARG BACKEND_API_URL=http://api:8000/api/v1
ARG AUTH_SECRET=build-time-placeholder

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV BACKEND_API_URL=$BACKEND_API_URL
ENV AUTH_SECRET=$AUTH_SECRET

RUN pnpm build

# --- Production stage ---
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone output and static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

# --- Development stage ---
FROM node:22-alpine AS development

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
