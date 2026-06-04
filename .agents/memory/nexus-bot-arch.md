---
name: Nexus bot command architecture
description: How nexus commands are structured vs zao, and installation quirks
---

## Command format
Nexus uses:
```js
module.exports = {
  name: "command",
  aliases: [...],
  description: "...",
  adminOnly: false,
  execute(api, event, args, settings, state) { ... }
};
```
NOT zao's `module.exports.config` / `module.exports.run` pattern.

Args is already split (prefix + command name removed). For `/اوامر فئة`, args = `['فئة']`.

**Why:** handler.js calls `cmd.execute(api, event, args, settings, state)` where args = `body.slice(prefix.length).trim().split(/\s+/).slice(1)`.

## Bot installation
Must use `npm install --legacy-peer-deps` inside `bot/` — pnpm cannot be used for the bot.

## Category map for اوامر.js
CATEGORY_MAP in `bot/commands/اوامر.js` maps command names → one of 10 Arabic categories. Any unmapped command defaults to 'أدوات'.
