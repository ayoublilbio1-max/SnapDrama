import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import Storage from "expo-sqlite/kv-store";
import { useEffect, useMemo, useRef } from "react";
import { getTrending, useCatalog } from "../data/catalog";
import { useContinueWatching, useHistory } from "../data/history";
import { settingsActions, useSettings } from "../data/settings";
import { useT } from "../i18n";
import {
    ensurePermission,
    pushOnOpen,
    scheduleReminders,
    type ContinueInfo,
    type NotifData,
    type TrendingInfo,
} from "./index";

const ASKED_KEY = "notif.asked";
const HANDLED_KEY = "notif.handled";
const START_DELAY_MS = 2500; // let the first screen settle + history load

/** Plans the notifications (app open + 4 reminders) and opens the right screen when one is tapped. */
export function NotificationsGate() {
  const { status, catalog } = useCatalog();
  const settings = useSettings();
  const t = useT();
  const continueList = useContinueWatching();
  const history = useHistory();
  const opened = useRef(false);

  const cont: ContinueInfo = useMemo(() => {
    const s = continueList[0];
    if (!s) return null;
    const h = history[s.id];
    return { id: s.id, title: s.title, ep: h?.ep ?? 1, pos: h?.pos ?? 0 };
  }, [continueList, history]);
  const trending: TrendingInfo = useMemo(() => {
    const s = getTrending(catalog)[0];
    return s ? { id: s.id, title: s.title } : null;
  }, [catalog]);

  // reminders text follows the language + the latest series → re-plan when they change
  const planKey = `${t.lang}|${cont?.id ?? "-"}|${cont?.ep ?? 0}|${trending?.id ?? "-"}|${settings.notifications}`;

  useEffect(() => {
    if (status !== "ready") return;
    const timer = setTimeout(
      async () => {
        if (!settings.notifications) return;
        const firstTime = !Storage.getItemSync(ASKED_KEY);
        if (firstTime) Storage.setItemSync(ASKED_KEY, "1");
        const allowed = await ensurePermission(firstTime);
        if (!allowed) {
          if (firstTime) settingsActions.setNotifications(false); // said no → switch shows off
          return;
        }
        try {
          if (!opened.current) {
            opened.current = true;
            await pushOnOpen(cont, trending);
          }
          await scheduleReminders(cont, trending);
        } catch (e) {
          if (__DEV__) console.log("[notif] planning failed", String(e));
        }
      },
      opened.current ? 800 : START_DELAY_MS,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, planKey]);

  // tap on a notification (also when it started the app)
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response || status !== "ready") return;
    const id = `${response.notification.request.identifier}@${response.notification.date}`;
    if (Storage.getItemSync(HANDLED_KEY) === id) return; // already opened (e.g. after a reload)
    Storage.setItemSync(HANDLED_KEY, id);
    const data = response.notification.request.content.data as
      | NotifData
      | undefined;
    if (__DEV__) console.log(`[notif] tapped → ${data?.type ?? "nothing"}`);
    const go = () => {
      if (!data) return;
      if (data.type === "continue")
        router.push({
          pathname: "/watch/[id]",
          params: { id: data.id, ep: String(data.ep), t: String(data.t) },
        });
      else if (data.type === "series")
        router.push({ pathname: "/series/[id]", params: { id: data.id } });
      else if (data.type === "rewards") router.navigate("/rewards");
      else router.navigate("/for-you");
    };
    setTimeout(go, 300); // the navigator is mounted by now
  }, [response, status]);

  return null;
}
