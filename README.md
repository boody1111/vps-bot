# nexus-bot — Railway Deployment

Single-service deployment repo. No monorepo, no pnpm workspace.

## Environment Variables (set in Railway → Variables)

| Variable | Description |
|---|---|
| `APPSTATE` | Facebook cookies JSON array |
| `BOT_SETTINGS` | `{"prefix":"/","admins":["YOUR_ID"],"botName":"Nexus"}` |
| `BOT_DIR` | Optional: set to `/data` if you add a Volume |

## Volume (optional)
Mount a Volume at `/data`, set `BOT_DIR=/data` to keep cookies across redeploys.
