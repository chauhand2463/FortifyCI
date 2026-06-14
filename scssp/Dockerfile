FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl curl wget

# Install Trivy for container image scanning
RUN wget -qO /tmp/trivy.tar.gz https://github.com/aquasecurity/trivy/releases/download/v0.71.0/trivy_0.71.0_Linux-64bit.tar.gz && \
    tar -xzf /tmp/trivy.tar.gz -C /usr/local/bin/ trivy && \
    rm /tmp/trivy.tar.gz && \
    trivy --version

# Pre-download Trivy vulnerability DB so scans don't need to download it at runtime
RUN mkdir -p /app/.trivy-cache && \
    trivy image --download-db-only --cache-dir /app/.trivy-cache 2>&1 || echo "Trivy DB pre-download skipped (will download at runtime if needed)"

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY src/ ./src/
COPY keys/ ./keys/

RUN npm run build

RUN mkdir -p /app/reports

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

RUN printf '#!/bin/sh\nset -e\nnpx prisma db push --accept-data-loss 2>&1\nif [ "$SKIP_SEED" != "true" ]; then npx tsx prisma/seed.ts 2>&1; fi\nif [ ! -f "${TRIVY_CACHE_DIR:-/app/.trivy-cache}/db/metadata.json" ]; then\n  echo "Pre-downloading Trivy vulnerability DB..."\n  mkdir -p "${TRIVY_CACHE_DIR:-/app/.trivy-cache}"\n  trivy image --download-db-only --cache-dir "${TRIVY_CACHE_DIR:-/app/.trivy-cache}" 2>&1 || echo "Trivy DB download failed, will try at scan time"\nfi\necho "Startup complete, starting server..."\nnpx tsx src/main.ts\n' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
