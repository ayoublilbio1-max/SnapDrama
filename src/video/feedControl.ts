/**
 * Direct pause/resume for the For you feed videos.
 * Screens behind the top one are frozen (no re-render), so a React state change can't pause
 * the feed when you open a series — the sound would keep playing behind. These calls act on
 * the players immediately, outside React.
 */
type Control = { pause: () => void; resume: () => void };
const controls = new Set<Control>();

export function registerFeedControl(c: Control) {
  controls.add(c);
  return () => {
    controls.delete(c);
  };
}

export function pauseFeed() {
  controls.forEach((c) => c.pause());
}

export function resumeFeed() {
  controls.forEach((c) => c.resume());
}
