/**
 * Stops a fast double tap from opening the same page twice (two pages stacked → Back twice).
 * Returns false if another navigation started less than 1 s ago.
 */
const LOCK_MS = 1000; // also covers a slow second tap while the dev build is still opening the page
let last = 0;

export function canNavigate(what: string): boolean {
  const now = Date.now();
  if (now - last < LOCK_MS) {
    if (__DEV__) console.log(`[nav] double tap ignored (${what})`);
    return false;
  }
  last = now;
  return true;
}
