#!/bin/sh
set -e

echo "[START] Launching bot and API server..."

# ── Data directory init ───────────────────────────────────────────────────────
# BOT_DIR is the persistent data directory (Railway volume: /data, or /app/bot
# for plain Docker without a volume). Ensure it exists and seed required files
# from the source defaults if they haven't been created yet.
DATA_DIR="${BOT_DIR:-/app/bot}"
mkdir -p "$DATA_DIR"

for f in appstate.json alt.json settings.json module-commands.json; do
  if [ ! -f "$DATA_DIR/$f" ] && [ -f "/app/bot/$f" ]; then
    cp "/app/bot/$f" "$DATA_DIR/$f"
    echo "[START] Seeded $f into $DATA_DIR"
  fi
done

# Ensure runtime files always start fresh (they're ephemeral state, not config)
echo "[]" > "$DATA_DIR/runtime-logs.json"
echo "{}" > "$DATA_DIR/runtime-state.json"
echo "[]" > "$DATA_DIR/module-commands.json"

# ── Bot ───────────────────────────────────────────────────────────────────────
cd /app/bot
node Main.js &
BOT_PID=$!
echo "[START] Bot started (PID $BOT_PID)"

# ── API server ────────────────────────────────────────────────────────────────
# dist lives at /app/artifacts/api-server/dist/ which matches the path baked
# into the pino worker references during the Stage 1 build.
cd /app
node --enable-source-maps ./artifacts/api-server/dist/index.mjs &
API_PID=$!
echo "[START] API server started (PID $API_PID)"

# Monitor both processes every 5 s.
# If either exits, kill the other and exit non-zero so Railway restarts the container.
while kill -0 $BOT_PID 2>/dev/null && kill -0 $API_PID 2>/dev/null; do
  sleep 5
done

echo "[START] A process exited unexpectedly — shutting down for restart."
kill $BOT_PID 2>/dev/null || true
kill $API_PID 2>/dev/null || true
exit 1
