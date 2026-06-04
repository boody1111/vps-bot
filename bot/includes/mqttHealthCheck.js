"use strict";
/**
 * MQTT Health Check — double-confirm + network-probe watchdog
 * Ported & adapted for Nexus from ZAO's mqttHealthCheck.js
 *
 * How it works:
 *   1. Every 60 s, checks global.lastMqttActivity timestamp.
 *   2. If silence > SILENCE_MS (12 min), probes the internet to rule out
 *      local network outage.
 *   3. Only if both MQTT is silent AND the internet is reachable does it
 *      trigger a listener restart via global.nexusReattach().
 *   4. Backs off exponentially (60 s → 120 s → 240 s → cap 600 s) to
 *      avoid hammering the listener on genuine dead sessions.
 *
 * Requirements (set by Main.js before calling start()):
 *   global.lastMqttActivity  — epoch ms, updated by listener.js on every event
 *   global.nexusReattach     — function() → restarts the listener
 */

const axios = require("axios");

const SILENCE_MS     = 12 * 60 * 1000;  // 12 min of MQTT silence triggers check
const PROBE_URLS     = [
  "https://www.google.com/generate_204",
  "https://dns.google/resolve?name=facebook.com&type=A",
  "https://1.1.1.1/",
];
const PROBE_TIMEOUT  = 8000;
const CHECK_INTERVAL = 60 * 1000;

let _backoffMs = 60 * 1000;
const BACKOFF_MAX_MS = 10 * 60 * 1000;

let _pendingRestart = false;
let _lastRestartAt  = 0;
const MIN_RESTART_GAP_MS = 3 * 60 * 1000;

function resetBackoff() {
  _backoffMs = 60 * 1000;
}

function nextBackoff() {
  const cur = _backoffMs;
  _backoffMs = Math.min(_backoffMs * 2, BACKOFF_MAX_MS);
  return cur;
}

async function probeInternet() {
  const url = PROBE_URLS[Math.floor(Math.random() * PROBE_URLS.length)];
  try {
    await axios.get(url, {
      timeout: PROBE_TIMEOUT,
      headers: { "User-Agent": "Mozilla/5.0" },
      validateStatus: (s) => s < 600,
    });
    return true;
  } catch {
    return false;
  }
}

async function check() {
  if (_pendingRestart) return;

  const lastActivity = global.lastMqttActivity || 0;
  const silentMs = Date.now() - lastActivity;

  if (silentMs < SILENCE_MS) {
    resetBackoff();
    return;
  }

  console.warn(`[MQTT-HEALTH] MQTT silent for ${Math.round(silentMs / 60000)} min — probing internet...`);

  const online = await probeInternet();
  if (!online) {
    console.warn("[MQTT-HEALTH] Internet probe failed — likely a local network issue. Waiting...");
    return;
  }

  // Internet is up but MQTT is dead — genuine connection loss
  const now = Date.now();
  if (now - _lastRestartAt < MIN_RESTART_GAP_MS) {
    console.warn("[MQTT-HEALTH] Too soon since last restart — skipping.");
    return;
  }

  _pendingRestart = true;
  const backoff = nextBackoff();
  console.warn(`[MQTT-HEALTH] Internet OK but MQTT dead — restarting listener in ${Math.round(backoff / 1000)}s.`);

  setTimeout(() => {
    try {
      _lastRestartAt = Date.now();
      global.lastMqttActivity = Date.now(); // reset silence timer
      if (typeof global.nexusReattach === "function") {
        global.nexusReattach();
        console.log("[MQTT-HEALTH] Listener restart triggered.");
      } else {
        console.error("[MQTT-HEALTH] global.nexusReattach not set — cannot restart.");
      }
    } catch (e) {
      console.error("[MQTT-HEALTH] Restart error:", e.message);
    } finally {
      _pendingRestart = false;
    }
  }, backoff);
}

function start() {
  global.lastMqttActivity = global.lastMqttActivity || Date.now();

  setInterval(() => {
    check().catch((e) => {
      console.error("[MQTT-HEALTH] Check error:", e.message);
    });
  }, CHECK_INTERVAL).unref();

  console.log("[MQTT-HEALTH] MQTT health watchdog active.");
}

module.exports = { start };
