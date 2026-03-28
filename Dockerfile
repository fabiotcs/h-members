# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json* ./

# Copy workspace package.json files
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including dev for build)
RUN npm ci --production=false

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules

# Copy all source code
COPY . .

# Build shared first (dependency of api and web)
RUN npm run build -w @h-members/shared

# Build API
RUN npm run build -w @h-members/api

# Build Web (pass build-time env vars for Next.js)
ARG APP_URL=http://localhost
ARG PLATFORM_NAME=H-Members
ENV NEXT_PUBLIC_API_URL=${APP_URL}/api
ENV NEXT_PUBLIC_PLATFORM_NAME=${PLATFORM_NAME}
RUN npm run build -w @h-members/web

# Prune dev dependencies for production
RUN npm prune --production

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install Nginx and supervisord
RUN apk add --no-cache nginx supervisor mysql-client

# Copy built artifacts — shared
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# Copy built artifacts — API
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/package.json ./packages/api/
COPY --from=builder /app/packages/api/prisma ./packages/api/prisma

# Copy built artifacts — Web (Next.js standalone output)
COPY --from=builder /app/packages/web/.next/standalone ./packages/web/
COPY --from=builder /app/packages/web/.next/static ./packages/web/.next/static
COPY --from=builder /app/packages/web/public ./packages/web/public

# Copy production node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy Docker configs
COPY docker/nginx/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy supervisord config
COPY docker/supervisord.conf /etc/supervisord.conf

# Create uploads directory structure
RUN mkdir -p /app/uploads/covers /app/uploads/materials /app/uploads/logos

EXPOSE 80
VOLUME ["/app/uploads"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost/api/v1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
