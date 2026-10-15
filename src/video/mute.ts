import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";

/** One sound setting for all videos (feed + player), remembered on the phone. */
const KEY = "video.muted";
let muted = false;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    muted = (await Storage.getItem(KEY)) === "1";
    if (__DEV__) console.log(`[video] sound ${muted ? "muted" : "on"} (saved)`);
  } catch {
    // keep default
  }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  load();
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

export function toggleMuted() {
  muted = !muted;
  emit();
  Storage.setItem(KEY, muted ? "1" : "0").catch(() => {});
  if (__DEV__) console.log(`[video] sound ${muted ? "muted" : "on"}`);
}
