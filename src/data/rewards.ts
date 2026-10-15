import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";
import type { Key } from "../i18n/strings";
import { walletActions, walletReady } from "./wallet";

/**
 * Rewards tab (demo coins): 7-day check-in streak + daily tasks + one-time tasks.
 * Saved on the phone (expo-sqlite kv-store). Every reward = a line in the coin history.
 */
export const CHECKIN_COINS = [10, 15, 20, 25, 30, 40, 60]; // day 1 → day 7, then the week starts again

export type TaskId = "watch1" | "watch3" | "save" | "rate" | "share";
export type TaskDef = {
  id: TaskId;
  title: string; // English (logs)
  titleKey: Key; // shown in the app language
  coins: number;
  daily: boolean; // daily = resets every day, else once ever
  goal: number;
  icon:
    | "play-circle-outline"
    | "film-outline"
    | "bookmark-outline"
    | "star-outline"
    | "share-social-outline";
  go: "feed" | "home";
};

export const TASKS: TaskDef[] = [
  {
    id: "watch1",
    title: "Watch 1 episode",
    titleKey: "task.watch1",
    coins: 5,
    daily: true,
    goal: 1,
    icon: "play-circle-outline",
    go: "home",
  },
  {
    id: "watch3",
    title: "Watch 3 episodes",
    titleKey: "task.watch3",
    coins: 15,
    daily: true,
    goal: 3,
    icon: "film-outline",
    go: "home",
  },
  {
    id: "save",
    title: "Save a series to My list",
    titleKey: "task.save",
    coins: 10,
    daily: false,
    goal: 1,
    icon: "bookmark-outline",
    go: "home",
  },
  {
    id: "rate",
    title: "Rate a series",
    titleKey: "task.rate",
    coins: 10,
    daily: false,
    goal: 1,
    icon: "star-outline",
    go: "home",
  },
  {
    id: "share",
    title: "Share a series",
    titleKey: "task.share",
    coins: 20,
    daily: false,
    goal: 1,
    icon: "share-social-outline",
    go: "feed",
  },
];

type RewardsState = {
  streak: number; // check-ins in the current week (0..7)
  lastCheckIn: string | null; // day key
  watchedDay: string | null; // day of the list below
  watchedToday: string[]; // "seriesId:n" opened in the player today (unique)
  claimed: Partial<Record<TaskId, string>>; // task → day key (daily) or 'once'
};

const KEY = "rewards.v1";
let state: RewardsState = {
  streak: 0,
  lastCheckIn: null,
  watchedDay: null,
  watchedToday: [],
  claimed: {},
};
let loaded = false;
const listeners = new Set<() => void>();

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

function emit() {
  listeners.forEach((l) => l());
}
function set(next: RewardsState) {
  state = next;
  emit();
  Storage.setItem(KEY, JSON.stringify(state)).catch((e) => {
    if (__DEV__) console.log("[rewards] save failed", String(e));
  });
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await Storage.getItem(KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
    if (__DEV__)
      console.log(
        `[rewards] loaded — streak ${state.streak}, last check-in ${state.lastCheckIn ?? "never"}`,
      );
  } catch (e) {
    if (__DEV__) console.log("[rewards] load failed", String(e));
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

export function preloadRewards() {
  load();
}

export function useRewards(): RewardsState {
  return useSyncExternalStore(subscribe, () => state);
}

/** What the check-in card shows today. */
export function checkInView(s: RewardsState) {
  const today = dayKey();
  const doneToday = s.lastCheckIn === today;
  const keepsStreak = s.lastCheckIn === yesterdayKey();
  // days already done in this week (a missed day or a finished week → start again at day 1)
  const done = doneToday
    ? s.streak
    : keepsStreak && s.streak < 7
      ? s.streak
      : 0;
  const nextDay = doneToday ? null : done + 1; // 1..7
  return {
    doneToday,
    done,
    nextDay,
    nextCoins: nextDay ? CHECKIN_COINS[nextDay - 1] : 0,
  };
}

/** Today's progress of one task (count, goal, done, claimed). */
export function taskView(
  t: TaskDef,
  s: RewardsState,
  user: { saved: number; rated: number; shared: number },
) {
  const today = dayKey();
  const watched = s.watchedDay === today ? s.watchedToday.length : 0;
  const count =
    t.id === "watch1" || t.id === "watch3"
      ? watched
      : t.id === "save"
        ? user.saved
        : t.id === "rate"
          ? user.rated
          : user.shared;
  const claimed = t.daily ? s.claimed[t.id] === today : !!s.claimed[t.id];
  return { count: Math.min(count, t.goal), done: count >= t.goal, claimed };
}

export const rewardsActions = {
  async checkIn() {
    const v = checkInView(state);
    if (v.doneToday || !v.nextDay) return 0;
    await walletReady();
    set({ ...state, streak: v.nextDay, lastCheckIn: dayKey() });
    walletActions.reward(v.nextCoins, `Daily check-in · day ${v.nextDay}`, {
      key: "hist.checkin",
      params: { n: v.nextDay },
    });
    if (__DEV__)
      console.log(`[rewards] check-in day ${v.nextDay} +${v.nextCoins}`);
    return v.nextCoins;
  },
  async claim(t: TaskDef) {
    const today = dayKey();
    set({
      ...state,
      claimed: { ...state.claimed, [t.id]: t.daily ? today : "once" },
    });
    await walletReady();
    walletActions.reward(t.coins, `Task · ${t.title}`, { key: t.titleKey });
    if (__DEV__) console.log(`[rewards] task ${t.id} claimed +${t.coins}`);
  },
  /** The player shows an episode → counts for "Watch N episodes" (each episode once a day). */
  episodeWatched(seriesId: string, n: number) {
    if (n <= 0) return;
    const today = dayKey();
    const list = state.watchedDay === today ? state.watchedToday : [];
    const k = `${seriesId}:${n}`;
    if (list.includes(k)) return;
    set({ ...state, watchedDay: today, watchedToday: [...list, k] });
    if (__DEV__)
      console.log(`[rewards] episodes watched today: ${list.length + 1}`);
  },
};
