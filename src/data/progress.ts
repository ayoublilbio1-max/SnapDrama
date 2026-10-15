import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";

/**
 * Per-episode watch progress (YouTube-style bar + "watched" state), saved on the phone.
 * While playing, updates are quiet (no re-render 4×/second); screens refresh when an episode
 * finishes, when the Episodes sheet opens, and when the player closes (flush).
 */
export type EpisodeProgress = { pos: number; dur: number; done: boolean };
type ProgressState = Record<string, EpisodeProgress>; // "seriesId:n"

const KEY = "progress.v1";
const PERSIST_EVERY_MS = 5000;
const DONE_RATIO = 0.95; // 95 % watched = watched
const MIN_STARTED_S = 3; // less than 3 s = not really started

let state: ProgressState = {};
let loaded = false;
let lastPersist = 0;
const listeners = new Set<() => void>();

const key = (seriesId: string, n: number) => `${seriesId}:${n}`;

function emit() {
  state = { ...state }; // new object → subscribed screens re-render
  listeners.forEach((l) => l());
}

function persist(force = false) {
  const now = Date.now();
  if (!force && now - lastPersist < PERSIST_EVERY_MS) return;
  lastPersist = now;
  Storage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

async function load() {
  if (loaded) return;
  loaded = true;
  const t0 = Date.now();
  try {
    const raw = await Storage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
    if (__DEV__)
      console.log(
        `[progress] loaded in ${Date.now() - t0}ms — ${Object.keys(state).length} episodes`,
      );
  } catch (e) {
    if (__DEV__) console.log("[progress] load failed", String(e));
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

export function preloadProgress() {
  load();
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, () => state);
}

export const progressActions = {
  /** From the player, many times per second → quiet. */
  update(seriesId: string, n: number, pos: number, dur: number) {
    if (n <= 0 || !(dur > 0)) return;
    const k = key(seriesId, n);
    const prev = state[k];
    const done = (prev?.done ?? false) || pos / dur >= DONE_RATIO;
    state[k] = { pos, dur, done };
    if (done && !prev?.done) {
      if (__DEV__)
        console.log(
          `[progress] ${k} watched (${Math.round((pos / dur) * 100)}%)`,
        );
      emit();
      persist(true);
      return;
    }
    persist();
  },
  /** Episode reached its end. */
  markDone(seriesId: string, n: number) {
    if (n <= 0) return;
    const k = key(seriesId, n);
    const prev = state[k];
    if (prev?.done) return;
    state[k] = { pos: prev?.dur ?? 0, dur: prev?.dur ?? 0, done: true };
    if (__DEV__) console.log(`[progress] ${k} watched (ended)`);
    emit();
    persist(true);
  },
  /** Refresh screens + save now (player closes, Episodes sheet opens). */
  flush() {
    emit();
    persist(true);
  },
};

/** What an episode box shows. */
export function episodeView(p: EpisodeProgress | undefined): {
  watched: boolean;
  ratio: number;
} {
  if (!p) return { watched: false, ratio: 0 };
  if (p.done) return { watched: true, ratio: 1 };
  if (p.pos < MIN_STARTED_S || !(p.dur > 0))
    return { watched: false, ratio: 0 };
  return { watched: false, ratio: Math.min(1, p.pos / p.dur) };
}

export function progressKey(seriesId: string, n: number) {
  return key(seriesId, n);
}
