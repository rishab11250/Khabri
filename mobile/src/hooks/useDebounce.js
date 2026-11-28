/**
 * Debounces rapidly changing values such as catalog search inputs.
 */
import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` updated `delayMs` after the last change.
 *
 * @param {*} value - Input value to debounce.
 * @param {number} [delayMs] - Delay window in milliseconds (`250` default).
 * @returns {*} Debounced value.
 */
export function useDebounce(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
