# syntax=docker/dockerfile:1.6
# ─── Stage 1: build the Angular bundle ──────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && \
    # Flatten dist/<project>(/browser)? to dist/app so the runtime stage is project-name agnostic
    DIST_DIR="$(find dist -mindepth 1 -maxdepth 2 -type d -name browser -print -quit || true)" && \
    if [ -z "$DIST_DIR" ]; then DIST_DIR="$(find dist -mindepth 1 -maxdepth 1 -type d -print -quit)"; fi && \
    mkdir -p /app/_out && cp -r "$DIST_DIR"/. /app/_out/

# ─── Stage 2: serve with nginx ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Drop the default config and use our hardened SPA-friendly one
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular CLI emits to dist/<project>; we glob to be project-name agnostic.
COPY --from=build /app/_out/ /usr/share/nginx/html/

# Run nginx as the non-root user that ships with the alpine image
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
