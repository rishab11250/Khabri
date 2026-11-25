import { useEffect, useState } from 'react';

export function computeCountdown(dueAt, nowMs = Date.now()) {
  const targetMs = new Date(dueAt).getTime();
  if (Number.isNaN(targetMs)) {
    return { valid: false, daysLeft: 0, expired: false };
  }
  const diffMs = targetMs - nowMs;
  const expired = diffMs < 0;
  const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return { valid: true, daysLeft, expired };
}

export function useCountdown(dueAt) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return computeCountdown(dueAt, nowMs);
}
