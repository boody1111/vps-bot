---
name: Panel build and routing
description: How the React panel is built, served, and how navigation works
---

## Build
```bash
BASE_PATH=/panel/ pnpm --filter @workspace/panel run build
```
Output goes to `artifacts/panel/dist/public/`.  
API server serves it as static files at `/panel/`.

## Routing
Wouter with `base={import.meta.env.BASE_URL.replace(/\/$/, "")}` which equals `/panel`.  
Tab navigation is `useState<Tab>` — NOT URL routing. Clicking tabs does NOT change the URL.

## Mobile CSS
`artifacts/panel/src/index.css` — mobile overrides at `@media (max-width: 520px)`:
- `.nex-tabs` → `flex-wrap: nowrap; overflow-x: auto` (horizontally scrollable)
- Grid columns → `repeat(auto-fit, minmax(140px, 1fr))` in dashboard.tsx OverviewTab

## White screen prevention
If the bot is offline, components render gracefully with `?.` optional chaining — no crash. Data loads asynchronously via TanStack Query with polling.

## Tab IDs (current)
`overview | logs | commands | cookies | scheduler | control | config | send`
