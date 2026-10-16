import { useSyncExternalStore } from "react";

/** Playback speed for all videos (player menu ⋯). Session only: every app start is 1×. */
export const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
let speed = 1;
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useSpeed() {
  return useSyncExternalStore(subscribe, () => speed);
}

export function getSpeed() {
  return speed;
}

export function setSpeed(value: number) {
  if (speed === value) return;
  speed = value;
  listeners.forEach((l) => l());
  if (__DEV__) console.log(`[video] speed ${value}×`);
}
