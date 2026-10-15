import { useSyncExternalStore } from "react";
import { getSettings } from "../data/settings";

/**
 * One sound switch for all videos (feed + player).
 * Each app start begins with Settings › "Start videos muted" (default off = sound on).
 * The 🔊 button changes it for this session only.
 */
let muted = getSettings().startMuted;
const listeners = new Set<() => void>();
if (__DEV__)
  console.log(
    `[video] app start → ${muted ? "muted (setting on)" : "sound on"}`,
  );

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useMuted() {
  return useSyncExternalStore(subscribe, () => muted);
}

/** Current value without re-rendering (used when a new player is created). */
export function isMuted() {
  return muted;
}

export function setMuted(value: boolean, why: string) {
  if (muted === value) return;
  muted = value;
  emit();
  if (__DEV__) console.log(`[video] sound ${muted ? "muted" : "on"} (${why})`);
}

export function toggleMuted() {
  setMuted(!muted, "🔊 button");
}
