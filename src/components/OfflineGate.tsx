import Ionicons from "@expo/vector-icons/Ionicons";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useT } from "../i18n";
import { AppText } from "./AppText";

const BACK_ONLINE_MS = 2500; // how long "You're back online" stays

/** Offline only when the phone says so for sure (null = still checking → not offline). */
function isOffline(s: NetInfoState) {
  return s.isConnected === false || s.isInternetReachable === false;
}

/**
 * Brief §8: no internet → themed "No internet" screen with Retry.
 * "Browse offline" hides it (saved series, My list, coins still work) and shows a small red banner instead.
 * When the connection comes back: a green "You're back online" banner for 2.5 s, then nothing.
 */
export function OfflineGate() {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [backOnline, setBackOnline] = useState(false);
  const wasOffline = useRef(false);
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      const off = isOffline(s);
      if (off !== wasOffline.current) {
        wasOffline.current = off;
        if (__DEV__)
          console.log(
            off ? `[net] offline (${s.type})` : `[net] back online (${s.type})`,
          );
        if (backTimer.current) clearTimeout(backTimer.current);
        if (off) {
          setBackOnline(false);
        } else {
          setDismissed(false); // next time it goes offline, show the screen again
          setBackOnline(true);
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
          backTimer.current = setTimeout(
            () => setBackOnline(false),
            BACK_ONLINE_MS,
          );
        }
      }
      setOffline(off);
    });
    return () => {
      unsub();
      if (backTimer.current) clearTimeout(backTimer.current);
    };
  }, []);

  const retry = async () => {
    setChecking(true);
    Haptics.selectionAsync().catch(() => {});
    const t0 = Date.now();
    try {
      const s = await NetInfo.refresh();
      if (__DEV__)
        console.log(
          `[net] retry → ${isOffline(s) ? "still offline" : "online"} in ${Date.now() - t0}ms`,
        );
    } catch (e) {
      if (__DEV__) console.log("[net] retry failed", String(e));
    } finally {
      setTimeout(() => setChecking(false), 400); // short spinner so the tap is felt
    }
  };

  if (!offline) {
    if (!backOnline) return null;
    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        pointerEvents="none"
        style={[
          styles.banner,
          { top: insets.top + 4, backgroundColor: colors.success },
        ]}
      >
        <Ionicons name="wifi" size={14} color={colors.onSuccess} />
        <AppText
          weight="semibold"
          size={12}
          style={{ color: colors.onSuccess }}
        >
          {t("net.backOnline")}
        </AppText>
      </Animated.View>
    );
  }

  if (dismissed) {
    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        pointerEvents="none"
        style={[
          styles.banner,
          { top: insets.top + 4, backgroundColor: colors.danger },
        ]}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={14}
          color={colors.onDanger}
        />
        <AppText weight="semibold" size={12} color="onDanger">
          {t("net.offlineBanner")}
        </AppText>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View
        style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={40}
          color={colors.scheme === "dark" ? colors.glow : colors.primary}
        />
      </View>
      <AppText weight="bold" size={22} align="center">
        {t("net.title")}
      </AppText>
      <AppText
        size={14}
        color="textMuted"
        align="center"
        style={{ maxWidth: 300 }}
      >
        {t("net.message")}
      </AppText>
      <Pressable
        disabled={checking}
        onPress={retry}
        style={({ pressed }) => [
          styles.retry,
          {
            backgroundColor: colors.primary,
            opacity: checking ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name="refresh" size={18} color={colors.onPrimary} />
        <AppText weight="semibold" size={15} color="onPrimary">
          {checking ? t("net.checking") : t("common.retry")}
        </AppText>
      </Pressable>
      <Pressable
        onPress={() => {
          if (__DEV__) console.log("[net] browse offline");
          setDismissed(true);
        }}
        hitSlop={8}
        style={{ paddingVertical: 10 }}
      >
        <AppText weight="medium" size={14} color="textAccent">
          {t("net.browseOffline")}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  retry: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 50,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  banner: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
