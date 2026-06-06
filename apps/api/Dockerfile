# syntax=docker/dockerfile:1
#
# Multi-stage build for the CareSync API (pnpm monorepo).
# Build context MUST be the repo root, e.g.:
#   docker build -f apps/api/Dockerfile -t caresync-api .
# Railway: set build.dockerfilePath = apps/api/Dockerfile (see railway.json).

# ---- Base: Node 20 + pnpm + OpenSSL (required by Prisma) ----
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN corepack enable \
    && apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Build: install workspace, generate Prisma client, build API + deps ----
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @caresync/api exec prisma generate
RUN pnpm --filter "@caresync/api..." build

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
# Railway injects PORT and the DATABASE_URL/secrets at runtime; the app reads
# them from process.env (no .env file is copied into the image).
EXPOSE 3001
# Apply pending migrations, then start the server.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/server.js"]
