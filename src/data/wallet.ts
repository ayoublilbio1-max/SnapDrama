import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";
import { isEpisodeFree } from "./catalog";
import type { Episode, Series } from "./types";

/**
 * DEMO wallet (brief §8 "Fake coins & paywall") — fake coins, no real money.
 * Balance + coin history + unlocked episodes, saved on the phone (expo-sqlite kv-store),
 * still there after closing the app.
 */
export type CoinEntry = {
  id: string;
  kind: "welcome" | "unlock" | "buy" | "reward";
  amount: number; // + received, − spent
  label: string;
  at: number; // time
};

type WalletState = {
  balance: number;
  history: CoinEntry[]; // newest first
  unlocked: Record<string, number>; // "seriesId:n" → time unlocked
};

export const WELCOME_COINS = 200;
const KEY = "wallet.v1";
const MAX_HISTORY = 100;

let state: WalletState = { balance: 0, history: [], unlocked: {} };
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

const unlockKey = (seriesId: string, n: number) => `${seriesId}:${n}`;

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  Storage.setItem(KEY, JSON.stringify(state)).catch((e) => {
    if (__DEV__) console.log("[wallet] save failed", String(e));
  });
}

function entry(
  kind: CoinEntry["kind"],
  amount: number,
  label: string,
): CoinEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    amount,
    label,
    at: Date.now(),
  };
}

function set(next: WalletState) {
  state = { ...next, history: next.history.slice(0, MAX_HISTORY) };
  emit();
  persist();
}

function load() {
  if (!loading) loading = doLoad();
  return loading;
}

async function doLoad() {
  if (loaded) return;
  loaded = true;
  const t0 = Date.now();
  try {
    const raw = await Storage.getItem(KEY);
    if (raw) {
      state = { ...state, ...JSON.parse(raw) };
      if (__DEV__)
        console.log(
          `[wallet] loaded in ${Date.now() - t0}ms — balance ${state.balance}, ` +
            `${Object.keys(state.unlocked).length} unlocked, ${state.history.length} history lines`,
        );
    } else {
      // first start on this phone → welcome coins
      set({
        balance: WELCOME_COINS,
        history: [entry("welcome", WELCOME_COINS, "Welcome bonus")],
        unlocked: {},
      });
      if (__DEV__)
        console.log(`[wallet] first start → +${WELCOME_COINS} welcome coins`);
      return;
    }
  } catch (e) {
    if (__DEV__) console.log("[wallet] load failed", String(e));
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

/** Call once at app start (balance ready before the first unlock). */
export function preloadWallet() {
  load();
}

/** Resolves when the saved balance is loaded (VIP daily bonus waits for it). */
export function walletReady(): Promise<void> {
  return load();
}

export function useBalance(): number {
  return useSyncExternalStore(subscribe, () => state.balance);
}

export function useCoinHistory(): CoinEntry[] {
  return useSyncExternalStore(subscribe, () => state.history);
}

/** All unlocked episodes ("seriesId:n" → time). Changes only when something is unlocked. */
export function useUnlocked(): Record<string, number> {
  return useSyncExternalStore(subscribe, () => state.unlocked);
}

export function isUnlocked(
  unlocked: Record<string, number>,
  seriesId: string,
  n: number,
) {
  return !!unlocked[unlockKey(seriesId, n)];
}

export type EpisodeState = "free" | "locked" | "unlocked";

export function episodeState(
  series: Series,
  n: number,
  unlocked: Record<string, number>,
): EpisodeState {
  if (isEpisodeFree(series, n)) return "free";
  return isUnlocked(unlocked, series.id, n) ? "unlocked" : "locked";
}

/**
 * The rule (brief §8): an episode PLAYS only if it has a video link.
 * "Unlocked" is just the saved state — add the links to catalog.json later and it plays, no code change.
 */
export function playableEpisode(
  series: Series,
  n: number,
): Episode | undefined {
  return series.episodes.find((e) => e.n === n && !!(e.hlsUrl || e.mp4Url));
}

export const walletActions = {
  /**
   * Takes the coins and marks the episode unlocked. Returns false if the balance is too low.
   * VIP: free (no coins, no history line).
   */
  unlock(series: Series, n: number, price: number, vip = false): boolean {
    if (isUnlocked(state.unlocked, series.id, n)) return true;
    if (vip) {
      set({
        ...state,
        unlocked: { ...state.unlocked, [unlockKey(series.id, n)]: Date.now() },
      });
      if (__DEV__)
        console.log(
          `[paywall] unlocked ${series.id} ep ${n} — VIP (free), balance ${state.balance}`,
        );
      return true;
    }
    if (state.balance < price) {
      if (__DEV__)
        console.log(
          `[paywall] not enough coins for ${series.id} ep ${n} — balance ${state.balance}, needs ${price}`,
        );
      return false;
    }
    const balance = state.balance - price;
    set({
      balance,
      history: [
        entry("unlock", -price, `${series.title} · EP ${n}`),
        ...state.history,
      ],
      unlocked: { ...state.unlocked, [unlockKey(series.id, n)]: Date.now() },
    });
    if (__DEV__)
      console.log(
        `[paywall] unlocked ${series.id} ep ${n} — ${price} coins, balance ${balance}`,
      );
    return true;
  },
  /** Demo coin pack: no payment, the coins are just added. */
  buy(coins: number, label: string) {
    const balance = state.balance + coins;
    set({
      ...state,
      balance,
      history: [entry("buy", coins, label), ...state.history],
    });
    if (__DEV__)
      console.log(
        `[wallet] demo buy +${coins} (${label}) — balance ${balance}`,
      );
  },
  /** Free coins (Rewards tab). */
  reward(coins: number, label: string) {
    const balance = state.balance + coins;
    set({
      ...state,
      balance,
      history: [entry("reward", coins, label), ...state.history],
    });
    if (__DEV__)
      console.log(`[wallet] reward +${coins} (${label}) — balance ${balance}`);
  },
};
