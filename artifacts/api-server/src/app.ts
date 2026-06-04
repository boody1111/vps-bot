import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
// Disable ETags globally — assets use immutable hashed URLs; HTML uses no-store
app.set("etag", false);

// Allow the panel to be embedded in iframes (Replit preview, Canvas)
app.use((_req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the pre-built React panel at /
// In Docker (Railway): PANEL_DIST=/app/panel-dist
// In dev: env var not set → block is skipped (panel has its own Vite dev server)
const panelDist = process.env.PANEL_DIST;
if (panelDist && fs.existsSync(panelDist)) {
  logger.info({ panelDist }, "Serving panel static files");
  // Assets have hashed filenames — safe to cache long-term
  app.use("/assets", express.static(path.join(panelDist, "assets"), {
    maxAge: "1y",
    immutable: true,
  }));
  // Everything else: serve fresh (no caching) so index.html is never stale
  app.use("/", express.static(panelDist, { index: false }));
  // SPA fallback — any path that isn't a static file or /api returns index.html
  // no-store + no ETag so browsers never serve a stale cached version
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.removeHeader("ETag");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.sendFile(path.join(panelDist, "index.html"));
  });
}

export default app;
