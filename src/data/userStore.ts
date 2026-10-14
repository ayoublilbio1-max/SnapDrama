import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";
import type { Series } from "./types";

/**
 * What THIS tester did on this phone (brief §8 "How the taps react"): saved series (My list),
 * star ratings, shared series. Saved in expo-sqlite (kv-store), survives closing the app.
 * Counts shown = catalog starting number + this tester's action.
 */
type UserState = {
  saved: Record<string, number>; // seriesId → time saved (newest first in My list)
  ratings: Record<string, number>; // seriesId → 1..5
  shared: Record<string, true>; // seriesId → shared once
};

const KEY = "user.state.v1";
let state: UserState = { saved: {}, ratings: {}, shared: {} };
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  Storage.setItem(KEY, JSON.stringify(state)).catch((e) => {
    if (__DEV__) console.log("[user] save failed", String(e));
  });
}

async function load() {
  if (loaded) return;
  loaded = true;
  const t0 = Date.now();
  try {
    const raw = await Storage.getItem(KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
    if (__DEV__)
      console.log(
        `[user] loaded in ${Date.now() - t0}ms — saved ${Object.keys(state.saved).length}, ` +
          `rated ${Object.keys(state.ratings).length}, shared ${Object.keys(state.shared).length}`,
      );
  } catch (e) {
    if (__DEV__) console.log("[user] load failed", String(e));
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

function set(next: UserState) {
  state = next;
  emit();
  persist();
}

/** Call once at app start so Save / Rate are already loaded when a series page opens (no flicker). */
export function preloadUserState() {
  load();
}

export function useUserState(): UserState {
  return useSyncExternalStore(subscribe, () => state);
}

export const userActions = {
  toggleSave(id: string) {
    const saved = { ...state.saved };
    const now = !saved[id];
    if (now) saved[id] = Date.now();
    else delete saved[id];
    set({ ...state, saved });
    if (__DEV__) console.log(`[user] ${now ? "saved" : "unsaved"} ${id}`);
    return now;
  },
  rate(id: string, stars: number) {
    set({ ...state, ratings: { ...state.ratings, [id]: stars } });
    if (__DEV__) console.log(`[user] rated ${id} ${stars}★`);
  },
  markShared(id: string) {
    if (state.shared[id]) return false;
    set({ ...state, shared: { ...state.shared, [id]: true } });
    if (__DEV__) console.log(`[user] shared ${id} (+1)`);
    return true;
  },
};

/** Numbers shown for a series, with this tester's actions added. */
export function seriesStats(series: Series, user: UserState) {
  const myStars = user.ratings[series.id];
  const ratingCount = series.ratingCount + (myStars ? 1 : 0);
  const rating = myStars
    ? (series.rating * series.ratingCount + myStars) / ratingCount
    : series.rating;
  return {
    isSaved: !!user.saved[series.id],
    saveCount: series.saveCount + (user.saved[series.id] ? 1 : 0),
    shareCount: series.shareCount + (user.shared[series.id] ? 1 : 0),
    myStars: myStars ?? 0,
    rating: Math.round(rating * 10) / 10,
    ratingCount,
  };
}
