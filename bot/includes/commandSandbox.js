"use strict";
/**
 * Command Sandbox — wall-clock timeout wrapper with repeat-offender tracking
 * Ported & adapted for Nexus from ZAO's commandSandbox.js
 *
 * Wraps cmd.execute() in a watchdog that:
 *   • Kills any timer that hasn't completed within TIMEOUT_MS (90 s).
 *   • Tracks per-command failure counts.
 *   • After MAX_FAILURES failures in FAIL_WINDOW_MS, marks the command as
 *     suspended for SUSPEND_MS (1 h) and won't run it again until then.
 *
 * Usage:
 *   const sandbox = require("./includes/commandSandbox");
 *   sandbox.execute(cmd, api, event, args, settings, state, recordError);
 *
 * `recordError` is an optional callback(commandName) used by handler.js to
 * update its own error-budget counters.
 */

const TIMEOUT_MS      = 90 * 1000;
const MAX_FAILURES    = 3;
const FAIL_WINDOW_MS  = 5 * 60 * 1000;
const SUSPEND_MS      = 60 * 60 * 1000;

const _failures   = new Map();  // name → [timestamp]
const _suspended  = new Map();  // name → resumeAt

function isSuspended(name) {
  const until = _suspended.get(name);
  if (!until) return false;
  if (Date.now() > until) {
    _suspended.delete(name);
    console.log(`[SANDBOX] Command "${name}" resumed after suspension.`);
    return false;
  }
  return true;
}

function recordFailure(name) {
  const now  = Date.now();
  const list = (_failures.get(name) || []).filter((t) => now - t < FAIL_WINDOW_MS);
  list.push(now);
  _failures.set(name, list);

  if (list.length >= MAX_FAILURES) {
    const until = now + SUSPEND_MS;
    _suspended.set(name, until);
    _failures.delete(name);
    console.error(
      `[SANDBOX] Command "${name}" suspended for 1 h — ${MAX_FAILURES} failures in 5 min.`
    );
    return true;
  }
  return false;
}

function execute(cmd, api, event, args, settings, state, recordError) {
  const name = cmd.name || "unknown";

  if (isSuspended(name)) {
    api.sendMessage(
      `⚠️ الأمر "${name}" موقوف مؤقتاً بسبب أعطال متكررة. سيعود خلال ساعة.`,
      event.threadID
    );
    return;
  }

  let done = false;
  let watchdog = null;

  // Watchdog: fires if execute() hasn't returned within TIMEOUT_MS
  watchdog = setTimeout(() => {
    if (done) return;
    done = true;
    console.error(`[SANDBOX] Command "${name}" timed out after ${TIMEOUT_MS / 1000}s.`);
    const suspended = recordFailure(name);
    if (typeof recordError === "function") recordError(name);
    if (!suspended) {
      try {
        api.sendMessage(
          `⏱️ انتهت مهلة الأمر "${name}". جرب مرة أخرى.`,
          event.threadID
        );
      } catch {}
    }
  }, TIMEOUT_MS);

  try {
    cmd.execute(api, event, args, settings, state);
    done = true;
    clearTimeout(watchdog);
  } catch (e) {
    done = true;
    clearTimeout(watchdog);
    console.error(`[SANDBOX] Command "${name}" threw: ${e.message}`);
    recordFailure(name);
    if (typeof recordError === "function") recordError(name);
  }
}

module.exports = { execute, isSuspended };
