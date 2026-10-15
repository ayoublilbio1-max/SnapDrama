import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";
import { walletActions, walletReady } from "./wallet";

/**
 * DEMO VIP (simulated payment, saved on the phone).
 * VIP = locked episodes unlock free (no coins) + 100 bonus coins once a day.
 */
export const VIP_PLANS = [
  { id: "weekly", name: "Weekly", price: "$4.99", per: "/ week", note: "" },
  {
    id: "monthly",
    name: "Monthly",
    price: "$14.99",
    per: "/ month",
    note: "Most popular",
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$79.99",
    per: "/ year",
    note: "Save 55%",
  },
] as const;
export type PlanId = (typeof VIP_PLANS)[number]["id"];

export const VIP_DAILY_COINS = 100;
const PLAN_KEY = "vip.plan"; // same key as before → a plan chosen earlier is kept
const BONUS_KEY = "vip.bonusDay";

let plan: PlanId | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/** VIP daily bonus: once per calendar day while VIP is active. */
async function dailyBonus() {
  if (!plan) return;
  try {
    await walletReady(); // the balance must be loaded before adding coins
    const day = today();
    if ((await Storage.getItem(BONUS_KEY)) === day) return;
    await Storage.setItem(BONUS_KEY, day);
    walletActions.reward(VIP_DAILY_COINS, "VIP daily bonus", {
      key: "hist.vip",
    });
  } catch (e) {
    if (__DEV__) console.log("[vip] daily bonus failed", String(e));
  }
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const v = await Storage.getItem(PLAN_KEY);
    plan = v && VIP_PLANS.some((p) => p.id === v) ? (v as PlanId) : null;
    if (__DEV__) console.log(`[vip] plan: ${plan ?? "none"}`);
  } catch (e) {
    if (__DEV__) console.log("[vip] load failed", String(e));
  }
  emit();
  dailyBonus();
}

function subscribe(l: () => void) {
  listeners.add(l);
  load();
  return () => {
    listeners.delete(l);
  };
}

export function preloadVip() {
  load();
}

/** Active plan, or null. */
export function useVip(): PlanId | null {
  return useSyncExternalStore(subscribe, () => plan);
}

export const vipActions = {
  activate(id: PlanId) {
    plan = id;
    emit();
    Storage.setItem(PLAN_KEY, id).catch(() => {});
    if (__DEV__) console.log(`[vip] demo subscribe ${id}`);
    dailyBonus(); // first day's coins right away
  },
  cancel() {
    plan = null;
    emit();
    Storage.removeItem(PLAN_KEY).catch(() => {});
    if (__DEV__) console.log("[vip] demo cancel");
  },
};
