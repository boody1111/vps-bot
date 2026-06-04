
# ─── Stage 1: Build workspace (panel + API server) ───────────────────────────
FROM node:24-slim AS builder

RUN npm install -g pnpm@10.26.1

# IMPORTANT: WORKDIR must be /app here so that esbuild-plugin-pino bakes
# absolute paths like /app/artifacts/api-server/dist/thread-stream-worker.mjs
# into the bundle. Stage 2 also uses /app, so the paths match at runtime.
WORKDIR /app

# Copy entire workspace source
COPY pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json pnpm-lock.yaml ./
COPY artifacts/ ./artifacts/
COPY lib/ ./lib/
COPY scripts/ ./scripts/

# Install all workspace dependencies
RUN pnpm install

# Build panel → artifacts/panel/dist/public/
RUN BASE_PATH=/panel/ pnpm --filter @workspace/panel build

# Build API server → artifacts/api-server/dist/index.mjs
RUN pnpm --filter @workspace/api-server build


# ─── Stage 2: Production runner ──────────────────────────────────────────────
FROM node:24-slim AS runner

WORKDIR /app

# Bot: install its own dependencies
COPY bot/package.json ./bot/
RUN cd bot && npm install --production --legacy-peer-deps --no-package-lock

# Bot source files
COPY bot/ ./bot/

# API server: self-contained esbuild bundle — must live at the SAME absolute
# path as Stage 1 (/app/artifacts/api-server/dist/) so pino's baked-in worker
# paths resolve correctly at runtime.
COPY --from=builder /app/artifacts/api-server/dist/ ./artifacts/api-server/dist/

# Panel: pre-built static files served by the API server at /panel/
COPY --from=builder /app/artifacts/panel/dist/public/ ./panel-dist/

# Startup script
COPY start.sh ./
RUN chmod +x start.sh

# ── Environment ───────────────────────────────────────────────────────────────
# BOT_DIR: where persistent bot data files live (appstate.json, settings.json,
#   runtime-state.json, etc.). Default is /app/bot (no volume).
#   Override to a Railway Volume mount path (e.g. /data) to persist cookies
#   and settings across deploys.
ENV BOT_DIR=/app/bot
ENV PANEL_DIST=/app/panel-dist
ENV NODE_ENV=production

# start.sh seeds $BOT_DIR from /app/bot defaults and initialises runtime files.
CMD ["./start.sh"]
