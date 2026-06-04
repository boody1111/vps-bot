# Single-service — no pnpm workspace, pre-built artifacts included
FROM node:24-slim
WORKDIR /app

# Bot dependencies
COPY bot/package.json ./bot/
RUN cd bot && npm install --production --legacy-peer-deps --no-package-lock

# Bot source
COPY bot/ ./bot/

# API server (pre-built — must be at /app/artifacts/api-server/dist/ for pino)
COPY api-server-dist/ ./artifacts/api-server/dist/

# Panel static files
COPY panel-dist/ ./panel-dist/

# Startup script
COPY start.sh ./
RUN chmod +x start.sh

ENV BOT_DIR=/app/bot
ENV PANEL_DIST=/app/panel-dist
ENV NODE_ENV=production

CMD ["./start.sh"]
