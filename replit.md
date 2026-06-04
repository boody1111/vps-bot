# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
Also contains a Facebook Messenger bot in `/bot`.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Messenger Bot (`/bot`)

A Facebook Messenger bot built with `fca-unofficial`.

### Files
- `Main.js` — entry point, login, and all 4 protection systems
- `listener.js` — listens for messages via MQTT
- `handler.js` — routes messages to commands, manages shared state
- `appstate.json` — Facebook session cookies (must be filled before running)
- `alt.json` — backup cookies (auto-updated by protection system 1)
- `settings.json` — bot config: prefix, admin IDs, bot name
- `railway.toml` — Railway deployment config
- `commands/` — all command files

### Commands
| Command | Description |
|---------|-------------|
| `بينغ` | Ping/pong latency check |
| `ابتيم` | Uptime, CPU, RAM, system info |
| `اوامر` | List all commands |
| `nm` | Lock the group name |
| `قفل` | Lock the bot (admins only) |
| `محرك` | Auto-send message every X time |
| `كنيات` | Protect nicknames with a unified nickname |
| `cookie` | Manually refresh cookies |

### Protection Systems
1. Cookie renewal every 30–100 minutes (saves to appstate.json and alt.json)
2. Visits Facebook notification/friends page every 15–120 minutes
3. Pings facebook.com every 10–25 minutes
4. Random typing indicators before every response

### Setup
1. Fill `appstate.json` with valid Facebook cookies
2. Edit `settings.json` — set your admin user ID and prefix
3. Run: `cd bot && npm install && node Main.js`
