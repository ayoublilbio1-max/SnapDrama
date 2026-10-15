import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";
import { Appearance } from "react-native";

/**
 * Profile + app settings, saved on the phone (expo-sqlite kv-store).
 * Loaded SYNC at app start (getItemSync) so the chosen theme is applied before the first frame.
 */
export type ThemePref = "system" | "light" | "dark";
type Settings = {
  theme: ThemePref;
  name: string;
  avatar: string | null; // local photo uri
  userId: string; // fake demo ID shown on the profile
};

const KEY = "settings.v1";
const listeners = new Set<() => void>();

function newId() {
  return String(Math.floor(10000000 + Math.random() * 89999999));
}

function loadSync(): Settings {
  const base: Settings = {
    theme: "system",
    name: "Guest",
    avatar: null,
    userId: newId(),
  };
  try {
    const raw = Storage.getItemSync(KEY);
    if (raw) return { ...base, ...JSON.parse(raw) };
    Storage.setItemSync(KEY, JSON.stringify(base)); // keep the same demo ID from now on
  } catch (e) {
    if (__DEV__) console.log("[settings] load failed", String(e));
  }
  return base;
}

let state: Settings = loadSync();

function applyTheme(pref: ThemePref) {
  // 'unspecified' = follow the phone again
  const value = (pref === "system" ? "unspecified" : pref) as Parameters<
    typeof Appearance.setColorScheme
  >[0];
  Appearance.setColorScheme(value);
}

/** Call once at app start (src/app/_layout.tsx). */
export function initSettings() {
  applyTheme(state.theme);
  if (__DEV__)
    console.log(
      `[settings] theme ${state.theme} · name "${state.name}" · avatar ${state.avatar ? "yes" : "no"}`,
    );
}

function set(next: Settings) {
  state = next;
  listeners.forEach((l) => l());
  Storage.setItem(KEY, JSON.stringify(state)).catch((e) => {
    if (__DEV__) console.log("[settings] save failed", String(e));
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, () => state);
}

export const settingsActions = {
  setTheme(theme: ThemePref) {
    applyTheme(theme);
    set({ ...state, theme });
    if (__DEV__) console.log(`[settings] theme → ${theme}`);
  },
  setName(name: string) {
    const clean = name.trim().slice(0, 24) || "Guest";
    set({ ...state, name: clean });
    if (__DEV__) console.log(`[settings] name → "${clean}"`);
  },
  setAvatar(uri: string | null) {
    set({ ...state, avatar: uri });
    if (__DEV__) console.log(`[settings] avatar ${uri ? "set" : "removed"}`);
  },
};
