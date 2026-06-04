"use strict";
/**
 * StealthEngine v2 — Human-cadence camouflage layer
 * Ported & adapted for Nexus from ZAO's stealthEngineV2.js
 *
 * • Expanded UA rotation pool (20 desktop UAs)
 * • Randomised human-timing page browsing (notifications / friends / messages / home)
 * • Session heartbeat via lightweight keep-alive probe
 * • Night-time slowdown (2× intervals between 02:00–06:00)
 * • Fully self-scheduling; exports start(api) — call once after login.
 */

const axios = require("axios");

const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; CrOS x86_64 15359.58.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

const BROWSE_PAGES = [
  "https://www.facebook.com/",
  "https://www.facebook.com/notifications",
  "https://www.facebook.com/messages",
  "https://www.facebook.com/friends",
  "https://www.facebook.com/marketplace",
  "https://www.facebook.com/watch",
  "https://www.facebook.com/groups/feed",
  "https://www.facebook.com/gaming",
];

const ACCEPT_LANGS = [
  "ar,en-US;q=0.9,en;q=0.8",
  "en-US,en;q=0.9,ar;q=0.8",
  "ar-SA,ar;q=0.9,en;q=0.8",
  "en-GB,en;q=0.9,ar;q=0.7",
];

let _api = null;

function ri(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomUA() {
  return UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
}

function randomLang() {
  return ACCEPT_LANGS[Math.floor(Math.random() * ACCEPT_LANGS.length)];
}

function randomPage() {
  return BROWSE_PAGES[Math.floor(Math.random() * BROWSE_PAGES.length)];
}

function nightMultiplier() {
  const h = new Date().getHours();
  return h >= 2 && h < 6 ? 2.5 : 1;
}

function buildHeaders(cookieStr) {
  return {
    "Cookie": cookieStr,
    "User-Agent": randomUA(),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": randomLang(),
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
    "DNT": String(ri(0, 1)),
  };
}

function getCookieStr() {
  try {
    const appState = _api.getAppState();
    return appState.map((c) => `${c.key}=${c.value}`).join("; ");
  } catch {
    return "";
  }
}

// ─── Layer 1: Human-cadence page browsing ─────────────────────────────────────
function startHumanBrowse() {
  const schedule = () => {
    const jitter = ri(0, 15) * 60 * 1000;
    const base = ri(55, 110) * 60 * 1000;
    const delay = (base + jitter) * nightMultiplier();

    setTimeout(async () => {
      const page = randomPage();
      const cookieStr = getCookieStr();
      if (!cookieStr) { schedule(); return; }

      try {
        // Simulate reading: fetch, then wait a "read" duration
        await axios.get(page, {
          headers: buildHeaders(cookieStr),
          timeout: 18000,
          maxRedirects: 3,
          validateStatus: (s) => s < 500,
        });
        const readTime = ri(8, 45) * 1000;
        await new Promise((r) => setTimeout(r, readTime));
        console.log(`[STEALTH] Browsed ${page} (read time: ${Math.round(readTime / 1000)}s)`);
      } catch (e) {
        console.warn(`[STEALTH] Browse failed (${page}): ${e.message}`);
      }
      schedule();
    }, delay);
  };
  schedule();
}

// ─── Layer 2: Session keep-alive heartbeat ────────────────────────────────────
function startSessionHeartbeat() {
  const schedule = () => {
    const delay = ri(25, 55) * 60 * 1000 * nightMultiplier();

    setTimeout(async () => {
      const cookieStr = getCookieStr();
      if (!cookieStr) { schedule(); return; }

      try {
        await axios.get("https://www.facebook.com/favicon.ico", {
          headers: {
            "Cookie": cookieStr,
            "User-Agent": randomUA(),
            "Accept": "image/webp,*/*",
            "Referer": "https://www.facebook.com/",
          },
          timeout: 8000,
          validateStatus: (s) => s < 500,
        });
        console.log("[STEALTH] Session heartbeat OK.");
      } catch (e) {
        console.warn("[STEALTH] Heartbeat failed:", e.message);
      }
      schedule();
    }, delay);
  };
  schedule();
}

// ─── Layer 3: Notification page tap (simulates user checking alerts) ──────────
function startNotificationTap() {
  const schedule = () => {
    const delay = ri(40, 180) * 60 * 1000 * nightMultiplier();

    setTimeout(async () => {
      const cookieStr = getCookieStr();
      if (!cookieStr) { schedule(); return; }

      try {
        await axios.get("https://www.facebook.com/notifications", {
          headers: buildHeaders(cookieStr),
          timeout: 15000,
          validateStatus: (s) => s < 500,
        });
        console.log("[STEALTH] Notification page tapped.");
      } catch (e) {
        console.warn("[STEALTH] Notification tap failed:", e.message);
      }
      schedule();
    }, delay);
  };
  schedule();
}

// ─── Start all stealth layers ─────────────────────────────────────────────────
function start(api) {
  _api = api;
  startHumanBrowse();
  startSessionHeartbeat();
  startNotificationTap();
  console.log("[STEALTH] StealthEngine v2 active — 3 layers running.");
}

module.exports = { start };
