# ============================================================================
# HOS-BACKOFFICE — Next.js 15 multi-stage production image
#   deps → build → runner (node:20-alpine, non-root)
# ============================================================================

# ---------- Stage 1: dependencies (reproducible via package-lock.json) ------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- Stage 2: build (Next.js 15 App Router) --------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- Stage 3: runner --------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user (deployment hardening checklist §8)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Runtime dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force

# Build output + source required by route handlers / engines
# (next.config.ts is build-time only — copied for tooling parity; no public/ dir)
COPY --from=build /app/.next ./.next
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/src ./src
COPY --from=build /app/db ./db
COPY --from=build /app/scripts ./scripts

RUN mkdir -p .data && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
CMD ["npm", "run", "start"]
