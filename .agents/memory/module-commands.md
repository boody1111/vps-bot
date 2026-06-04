---
name: Module commands queue pattern
description: How the panel sends commands to the running bot
---

## Pattern
1. Panel/API writes a JSON object to `$BOT_DIR/module-commands.json` (array)
2. Bot polls this file every ~5s in Main.js via `processModuleCommand(cmd, api, botState)` switch
3. After processing, the array is cleared

## Supported types (as of last session)
- `hook_start` / `hook_stop` — خطاف scheduler
- `hook2_start` / `hook2_stop` — خطاف2 smart scheduler
- `nm_start` / `nm_stop` — name lock
- `nicknames_start` / `nicknames_stop` — nickname protection
- `send_message` — send a message to a threadID (added in this session)

## send_message shape
```json
{ "type": "send_message", "threadID": "...", "message": "...", "requestedAt": 1234567890 }
```

**Why:** Avoids needing a persistent socket between API and bot process; file-based queue is simple and survives restarts.
