"use strict";
/**
 * Event Loop Guard — stall detector using perf_hooks
 * Ported & adapted for Nexus from ZAO's eventLoopGuard.js
 *
 * Uses `perf_hooks.monitorEventLoopDelay` to get precise histogram-based
 * delay measurements (1 s resolution).  Alerts at 400 ms sustained lag,
 * exits at 1 000 ms sustained for > 20 s (deadlock condition).
 *
 * Exports: start()
 */

const { monitorEventLoopDelay } = require("perf_hooks");

const SAMPLE_INTERVAL_MS = 1000;
const WARN_MS            = 400;
const PANIC_MS           = 1000;
const PANIC_SUSTAIN_S    = 20;

function start() {
  let histogram;
  try {
    histogram = monitorEventLoopDelay({ resolution: 10 });
    histogram.enable();
  } catch (e) {
    console.warn("[EL-GUARD] perf_hooks not available:", e.message);
    return;
  }

  let panicStreak = 0;

  const timer = setInterval(() => {
    // mean is in nanoseconds
    const meanMs = histogram.mean / 1e6;
    histogram.reset();

    if (meanMs >= PANIC_MS) {
      panicStreak++;
      console.error(
        `[EL-GUARD] PANIC: event loop stall ${meanMs.toFixed(0)} ms (streak: ${panicStreak}/${PANIC_SUSTAIN_S})`
      );
      if (panicStreak >= PANIC_SUSTAIN_S) {
        console.error("[EL-GUARD] Sustained deadlock detected — forcing exit.");
        histogram.disable();
        clearInterval(timer);
        setTimeout(() => process.exit(1), 500);
      }
      return;
    }

    panicStreak = 0;

    if (meanMs >= WARN_MS) {
      console.warn(`[EL-GUARD] Event loop lag: ${meanMs.toFixed(0)} ms (threshold: ${WARN_MS} ms)`);
    }
  }, SAMPLE_INTERVAL_MS);

  timer.unref();
  console.log("[EL-GUARD] Event loop guard active (warn: 400 ms | panic: 1000 ms × 20 s).");
}

module.exports = { start };
