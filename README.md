# Nexus Bot

A Facebook Messenger bot with a React control panel and REST API server, running as a pnpm workspace monorepo.

## Project Structure

```
/
├── bot/                  — Facebook Messenger bot (Node.js, fca-unofficial)
│   ├── Main.js           — Entry point, login, protection systems
│   ├── handler.js        — Message routing, command loading
│   ├── listener.js       — MQTT listener
│   ├── commands/         — All command files
│   ├── appstate.json     — Facebook session cookies
│   ├── settings.json     — Bot config (prefix, admins, botName)
│   └── state-writer.js   — Shared state serialisation
├── artifacts/
│   ├── api-server/       — Express 5 REST API (TypeScript)
│   └── panel/            — React + Vite control panel
└── packages/
    ├── db/               — PostgreSQL + Drizzle ORM schema
    └── api-spec/         — OpenAPI spec + Orval codegen
```

## Quick Start

```bash
# Install all workspace dependencies
pnpm install

# Install bot dependencies
cd bot && npm install --legacy-peer-deps && cd ..

# Fill in the bot session
cp bot/appstate.example.json bot/appstate.json  # then add your cookies
# Edit bot/settings.json — set prefix, botName, admins array

# Build everything
pnpm run build

# Start the API server (port 5000)
PORT=5000 PANEL_DIST=./artifacts/panel/dist/public BOT_DIR=./bot \
  node --enable-source-maps ./artifacts/api-server/dist/index.mjs

# Start the bot
cd bot && node Main.js
```

## Bot Commands

| Command | Category | Description | Admin only |
|---------|----------|-------------|------------|
| `بينغ` | معلومات | Ping / latency check | |
| `ابتيم` | معلومات | Uptime, CPU, RAM | |
| `اوامر` | معلومات | List all commands | |
| `احصائيات` | معلومات | Bot stats | |
| `بروفايل` | معلومات | Facebook profile info | |
| `معرف` | معلومات | Get user/thread IDs | |
| `قفل` | إدارة البوت | Lock/unlock the bot | ✓ |
| `ادمن` | إدارة البوت | Admin management | ✓ |
| `ريفرش` | إدارة البوت | Reload settings | ✓ |
| `كوكيز` | إدارة البوت | Cookie status | ✓ |
| `رست` | إدارة البوت | Restart bot | ✓ |
| `shutdown` | إدارة البوت | Graceful shutdown | ✓ |
| `nm` | إدارة المجموعة | Lock group name | ✓ |
| `كنيات` | إدارة المجموعة | Nickname protection | ✓ |
| `تثبيت` | إدارة المجموعة | Pin message | ✓ |
| `kick` | إدارة المجموعة | Kick member | ✓ |
| `ban` | إدارة المجموعة | Ban member | ✓ |
| `تنظيف` | إدارة المجموعة | Clean messages | ✓ |
| `تصويت` | إدارة المجموعة | Create poll | |
| `حماية` | نظام | Protection status | ✓ |
| `صامت` | نظام | Silent mode | ✓ |
| `خطاف` | أدوات | Auto-message scheduler | ✓ |
| `خطاف2` | أدوات | Smart auto-messenger | ✓ |
| `angel` | أدوات | Recurring auto-send | ✓ |
| `محرك` | أدوات | Message motor | ✓ |
| `ترجم` | أدوات | Translate text | |
| `حاسبة` | أدوات | Calculator | |
| `عملة` | أدوات | Currency convert | |
| `طقس_مدينة` | أدوات | Weather | |
| `ذكرني` | أدوات | Reminder | |
| `اصنع` | ذكاء اصطناعي | AI image generate | |
| `صورة` | ميديا | Search images | |
| `تيكتوك` | ميديا | TikTok downloader | |
| `بنترست` | ميديا | Pinterest search | |
| `song` | ميديا | Song search | |
| `دايفل` | ألعاب | Devil game | |
| `كرة8` | ألعاب | 8-ball | |
| `نرد` | ألعاب | Dice roll | |
| `كلمة` | ألعاب | Word game | |
| `صراحة` | ألعاب | Truth or dare | |
| `تقييم` | ترفيه | Rate something | |
| `عشوائي` | ترفيه | Random choice | |
| `شخصية` | ترفيه | Personality test | |
| `نيكسس` | مطور | AI Chat (Nexus) | — |
| `تست` | مطور | Debug test | ✓ |

All commands respect the prefix set in `settings.json` (default `/`).

## Protection Systems

The bot runs **18 protection systems** automatically after login:

| # | Name | Interval |
|---|------|----------|
| P1 | Cookie renewal | 30–100 min |
| P2 | Facebook site visits | 15–120 min |
| P3 | Facebook ping | 10–25 min |
| P4 | Typing indicators | Per response |
| P5 | GraphQL activity visit | Scheduled |
| P6 | Memory guard | Continuous |
| P7 | Disk guard | 30 min |
| P8 | MQTT silence detector | Continuous |
| P9 | MQTT health backoff | Continuous |
| P10 | Raid / burst guard | Per request |
| P11 | Error budget per command | Per command |
| P12 | Session probe | Scheduled |
| P13 | Outbound flood guard | Per message |
| P14 | Cookie health check | Scheduled |
| P15 | Stealth engine v2 | Continuous |
| P16 | Disk guard v2 | Continuous |
| P17 | Event-loop stall detector | Continuous |
| P18 | MQTT health check | Continuous |

## Panel

Access the control panel at `/panel/` when the API server is running.

**Tabs:**
- **نظرة عامة** — Bot status, CPU/RAM, thread activity, protection timers
- **سجلات** — Live bot logs
- **الأوامر** — Full command list by category
- **كوكيز** — Cookie upload/management
- **الجدولة** — Scheduler and module control
- **تحكم** — Bot restart / reconnect
- **إعدادات** — Prefix, bot name, admins
- **إرسال** — Send a message to any group from the panel

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bot/status` | Bot running status |
| GET | `/api/bot/logs` | Recent bot logs |
| GET | `/api/bot/settings` | Bot settings |
| POST | `/api/bot/settings` | Update settings |
| GET | `/api/bot/cookies` | Cookie info |
| POST | `/api/bot/cookies` | Upload new cookies |
| POST | `/api/bot/reconnect` | Trigger reconnect |
| GET | `/api/bot/modules` | Module states |
| POST | `/api/bot/modules/start` | Start a module |
| POST | `/api/bot/modules/stop` | Stop a module |
| POST | `/api/bot/send` | Send message to group |
| GET | `/api/bot/sys-stats` | CPU/RAM stats |
| GET | `/api/bot/thread-activity` | Thread activity map |
| GET | `/api/bot/tconfig` | Telegram config |
| POST | `/api/bot/tconfig` | Update Telegram config |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | API server port (default 5000) |
| `BOT_DIR` | Bot data directory (appstate, settings, logs) |
| `PANEL_DIST` | Path to built panel static files |

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **Bot**: fca-unofficial (Facebook Messenger MQTT)
- **API**: Express 5 + TypeScript
- **Panel**: React 19 + Vite + TanStack Query
- **DB**: PostgreSQL + Drizzle ORM
- **Build**: esbuild (CJS bundle)
