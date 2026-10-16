/**
 * Stops a double tap from opening the same page twice (two pages stacked → Back twice).
 *
 * A time limit alone is not enough on a slow phone / dev build: the page can take more than 1 s
 * to open, and the 2nd tap (queued while the app was busy) arrives after that. So:
 * - after a tap starts a navigation, other taps are ignored until the new page is shown
 *   (root layout calls navArrived() when the route changes), max 4 s;
 * - and for 0.5 s after a page is shown (taps that were waiting in the queue).
 */
const LOCK_MS = 1000;
const PENDING_MAX_MS = 4000;
const AFTER_ARRIVE_MS = 500;
let last = 0;
let pending = false;
let arrivedAt = 0;

export function canNavigate(what: string): boolean {
  const now = Date.now();
  const busy =
    now - last < LOCK_MS ||
    (pending && now - last < PENDING_MAX_MS) ||
    now - arrivedAt < AFTER_ARRIVE_MS;
  if (busy) {
    if (__DEV__) console.log(`[nav] double tap ignored (${what})`);
    return false;
  }
  last = now;
  pending = true;
  return true;
}

/** Root layout: the visible route changed (a page finished opening). */
export function navArrived(path: string) {
  if (pending && __DEV__)
    console.log(`[nav] arrived ${path} in ${Date.now() - last}ms`);
  pending = false;
  arrivedAt = Date.now();
}
