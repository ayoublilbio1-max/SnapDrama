import Storage from "expo-sqlite/kv-store";
import { useMemo, useSyncExternalStore } from "react";
import { useCatalog } from "./catalog";
import type { Series } from "./types";

/**
 * Watch history (brief §8 Storage): last episode + position per series, newest first.
 * Feeds "Continue watching" on Home and the "Continue EP 3" button on the series page.
 */
export type HistoryEntry = { ep: number; pos: number; at: number };
type HistoryState = Record<string, HistoryEntry>;

const KEY = "history.v1";
let state: HistoryState = {};
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
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
        `[history] loaded in ${Date.now() - t0}ms — ${Object.keys(state).length} series`,
      );
  } catch (e) {
    if (__DEV__) console.log("[history] load failed", String(e));
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

export function preloadHistory() {
  load();
}

export function useHistory(): HistoryState {
  return useSyncExternalStore(subscribe, () => state);
}

export const historyActions = {
  /** Called by the player (throttled). pos in seconds. */
  save(seriesId: string, ep: number, pos: number) {
    const prev = state[seriesId];
    state = {
      ...state,
      [seriesId]: { ep, pos: Math.max(0, Math.floor(pos)), at: Date.now() },
    };
    emit();
    Storage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    if (__DEV__ && (!prev || prev.ep !== ep))
      console.log(`[history] ${seriesId} → ep ${ep}`);
  },
};

/** Series the user started, newest first (Home "Continue watching"). */
export function useContinueWatching(): Series[] {
  const { catalog } = useCatalog();
  const history = useHistory();
  return useMemo(
    () =>
      Object.entries(history)
        .sort((a, b) => b[1].at - a[1].at)
        .map(([id]) => catalog.series.find((s) => s.id === id))
        .filter((s): s is Series => !!s),
    [catalog, history],
  );
}

export function useResume(
  seriesId: string | undefined,
): HistoryEntry | undefined {
  const history = useHistory();
  return seriesId ? history[seriesId] : undefined;
}
