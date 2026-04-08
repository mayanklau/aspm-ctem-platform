# syntax=docker/dockerfile:1.6
# ─── Stage 1: install dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

# ─── Stage 2: runtime ───────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# tini gives us a real PID 1 (proper signal handling for graceful shutdown)
RUN apk add --no-cache tini && \
    addgroup -S aspm && \
    adduser  -S aspm -G aspm

ENV NODE_ENV=production \
    PORT=3001 \
    LOG_DIR=/app/logs

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=aspm:aspm . .

# Create writable runtime dirs and drop privileges
RUN mkdir -p /app/logs /app/uploads && \
    chown -R aspm:aspm /app/logs /app/uploads

USER aspm

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3001/livez || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
