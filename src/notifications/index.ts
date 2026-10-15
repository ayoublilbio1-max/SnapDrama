import * as Notifications from "expo-notifications";
import Storage from "expo-sqlite/kv-store";
import { Platform } from "react-native";
import { palette } from "../constants/colors";
import { tNow } from "../i18n";

/**
 * Local notifications only (brief §8 — no Firebase, no server):
 * - when the app opens: "Continue <series> — EP n" (or a welcome + trending one for new users)
 * - 4 daily reminders: 9:00 · 13:00 · 18:30 · 21:00
 * Tapping a notification opens the right screen (see NotificationsGate).
 */
export const CHANNEL_ID = "reminders";
const REMINDER_TIMES = [
  { hour: 9, minute: 0 },
  { hour: 13, minute: 0 },
  { hour: 18, minute: 30 },
  { hour: 21, minute: 0 },
];
const OPEN_KEY = "notif.lastOpenPush";
const OPEN_COOLDOWN_MS = 30 * 60 * 1000; // not again on every quick reopen / reload
const OPEN_DELAY_S = 5;

export type NotifData =
  | { type: "continue"; id: string; ep: number; t: number }
  | { type: "series"; id: string }
  | { type: "feed" }
  | { type: "rewards" };

export type ContinueInfo = {
  id: string;
  title: string;
  ep: number;
  pos: number;
} | null;
export type TrendingInfo = { id: string; title: string } | null;

// What shows while the app is open: banner + list, no sound (brief §9: choose with setNotificationHandler)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Android channel — must exist BEFORE asking for permission (brief §9). */
async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: tNow()("notif.channel"),
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180],
    lightColor: palette.violet,
  });
}

/** true = allowed. ask=true shows the system popup when not decided yet. */
export async function ensurePermission(ask: boolean): Promise<boolean> {
  try {
    await ensureChannel();
    const now = await Notifications.getPermissionsAsync();
    if (now.granted) return true;
    if (!ask || !now.canAskAgain) {
      if (__DEV__)
        console.log(`[notif] permission ${now.status} (asked again: no)`);
      return false;
    }
    const res = await Notifications.requestPermissionsAsync();
    if (__DEV__) console.log(`[notif] permission asked → ${res.status}`);
    return res.granted;
  } catch (e) {
    if (__DEV__) console.log("[notif] permission failed", String(e));
    return false;
  }
}

async function cancelReminders() {
  await Promise.all(
    REMINDER_TIMES.map((_, i) =>
      Notifications.cancelScheduledNotificationAsync(`reminder-${i}`).catch(
        () => {},
      ),
    ),
  );
}

/** (Re)plans the 4 daily reminders in the current language with the latest series. */
export async function scheduleReminders(
  cont: ContinueInfo,
  trending: TrendingInfo,
) {
  const t = tNow();
  await cancelReminders();
  const contData: NotifData | null = cont
    ? { type: "continue", id: cont.id, ep: cont.ep, t: cont.pos }
    : null;
  const plans: { title: string; body: string; data: NotifData }[] = [
    {
      title: t("notif.coinsTitle"),
      body: t("notif.coinsBody"),
      data: { type: "rewards" },
    },
    cont && contData
      ? {
          title: t("notif.waitingTitle"),
          body: t("notif.continueBody", { title: cont.title, n: cont.ep }),
          data: contData,
        }
      : {
          title: t("notif.trendingTitle"),
          body: trending
            ? t("notif.trendingBody", { title: trending.title })
            : t("notif.feedBody"),
          data: trending
            ? { type: "series", id: trending.id }
            : { type: "feed" },
        },
    trending
      ? {
          title: t("notif.tonightTitle"),
          body: t("notif.tonightBody", { title: trending.title }),
          data: { type: "series", id: trending.id },
        }
      : {
          title: t("notif.tonightTitle"),
          body: t("notif.feedBody"),
          data: { type: "feed" },
        },
    cont && contData
      ? {
          title: t("notif.oneMoreTitle"),
          body: t("notif.continueBody", { title: cont.title, n: cont.ep }),
          data: contData,
        }
      : {
          title: t("notif.oneMoreTitle"),
          body: t("notif.feedBody"),
          data: { type: "feed" },
        },
  ];
  for (let i = 0; i < REMINDER_TIMES.length; i++) {
    const { hour, minute } = REMINDER_TIMES[i];
    const p = plans[i];
    await Notifications.scheduleNotificationAsync({
      identifier: `reminder-${i}`,
      content: { title: p.title, body: p.body, data: p.data },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
  }
  if (__DEV__)
    console.log(
      `[notif] 4 daily reminders set (${t.lang}) — ${REMINDER_TIMES.map((r) => `${r.hour}:${String(r.minute).padStart(2, "0")}`).join(", ")}` +
        ` · continue ${cont ? `${cont.id} ep ${cont.ep}` : "none"}`,
    );
}

/** App opened → continue what you watched, or a welcome for new users. Max once every 30 min. */
export async function pushOnOpen(cont: ContinueInfo, trending: TrendingInfo) {
  const last = Number(Storage.getItemSync(OPEN_KEY) ?? 0);
  const wait = OPEN_COOLDOWN_MS - (Date.now() - last);
  if (wait > 0) {
    if (__DEV__)
      console.log(
        `[notif] open push skipped (again in ${Math.ceil(wait / 60000)} min)`,
      );
    return;
  }
  Storage.setItemSync(OPEN_KEY, String(Date.now()));
  const t = tNow();
  const content = cont
    ? {
        title: t("notif.continueTitle"),
        body: t("notif.continueBody", { title: cont.title, n: cont.ep }),
        data: {
          type: "continue",
          id: cont.id,
          ep: cont.ep,
          t: cont.pos,
        } satisfies NotifData,
      }
    : {
        title: t("notif.welcomeTitle"),
        body: trending
          ? t("notif.welcomeBody", { title: trending.title })
          : t("notif.feedBody"),
        data: { type: "feed" } satisfies NotifData,
      };
  await Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: OPEN_DELAY_S,
      channelId: CHANNEL_ID,
    },
  });
  if (__DEV__)
    console.log(
      `[notif] open push in ${OPEN_DELAY_S}s — ${cont ? `continue ${cont.id} ep ${cont.ep}` : "welcome"}`,
    );
}

/** Settings switch off / delete data → nothing planned any more. */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  if (__DEV__) console.log("[notif] all scheduled notifications cancelled");
}
