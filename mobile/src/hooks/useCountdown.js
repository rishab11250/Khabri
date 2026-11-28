/**
 * Computes and periodically refreshes remaining day counts for application deadlines.
 * Deliberately ticks hourly because UI granularity is day-level (`ceil(diffMs / day)`).
 */
import { useEffect, useState } from 'react';

/**
 * Computes calendar-day countdown metrics for a deadline ISO/Date target.
 *
 * @param {string|Date} dueAt - Target due date.
 * @param {number} [nowMs] - Reference epoch milliseconds (defaults to `Date.now()`).
 * @returns {{ valid: boolean, daysLeft: number, expired: boolean }} Countdown breakdown.
 */
function computeCountdown(dueAt, nowMs = Date.now()) {
  const targetMs = new Date(dueAt).getTime();
  if (Number.isNaN(targetMs)) {
    return { valid: false, daysLeft: 0, expired: false };
  }
  const diffMs = targetMs - nowMs;
  const expired = diffMs < 0;
  const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return { valid: true, daysLeft, expired };
}

/**
 * React hook returning live day countdown metrics refreshed every hour.
 *
 * @param {string|Date} dueAt - Target due date.
 * @returns {{ valid: boolean, daysLeft: number, expired: boolean }} Live countdown state.
 */
export function useCountdown(dueAt) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return computeCountdown(dueAt, nowMs);
}
