import { Image } from "expo-image";
import Storage from "expo-sqlite/kv-store";
import * as Updates from "expo-updates";
import { DevSettings } from "react-native";
import { cancelAllNotifications } from "../notifications";

/**
 * Settings › Account › Delete account (demo): everything this phone saved is wiped
 * (coins, unlocked episodes, history, progress, My list, ratings, rewards, VIP, profile, settings)
 * and the app restarts fresh.
 */
export async function deleteAllData() {
  const t0 = Date.now();
  try {
    await cancelAllNotifications();
    await Storage.clear();
    await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]).catch(
      () => {},
    );
    if (__DEV__)
      console.log(
        `[account] all data deleted in ${Date.now() - t0}ms → restart`,
      );
  } catch (e) {
    if (__DEV__) console.log("[account] delete failed", String(e));
    throw e;
  }
  // restart so every store starts empty again
  if (__DEV__) DevSettings.reload();
  else await Updates.reloadAsync();
}
