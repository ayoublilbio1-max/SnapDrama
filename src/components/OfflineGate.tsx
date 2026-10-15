import Ionicons from "@expo/vector-icons/Ionicons";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { AppText } from "./AppText";

/** Offline only when the phone says so for sure (null = still checking → not offline). */
function isOffline(s: NetInfoState) {
  return s.isConnected === false || s.isInternetReachable === false;
}

/**
 * Brief §8: no internet → themed "No internet" screen with Retry.
 * "Browse offline" hides it (saved series, My list, coins still work) and shows a small banner instead.
 * Comes back / goes away by itself when the connection changes.
 */
export function OfflineGate() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      const off = isOffline(s);
      if (off !== wasOffline.current) {
        wasOffline.current = off;
        if (__DEV__)
          console.log(
            off ? `[net] offline (${s.type})` : `[net] back online (${s.type})`,
          );
        if (!off) setDismissed(false); // next time it goes offline, show the screen again
      }
      setOffline(off);
    });
    return unsub;
  }, []);

  const retry = async () => {
    setChecking(true);
    Haptics.selectionAsync().catch(() => {});
    const t0 = Date.now();
    try {
      const s = await NetInfo.refresh();
      const off = isOffline(s);
      if (__DEV__)
        console.log(
          `[net] retry → ${off ? "still offline" : "online"} in ${Date.now() - t0}ms`,
        );
      setOffline(off);
    } catch (e) {
      if (__DEV__) console.log("[net] retry failed", String(e));
    } finally {
      setTimeout(() => setChecking(false), 400); // short spinner so the tap is felt
    }
  };

  if (!offline) return null;

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
          Offline — showing saved content
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
        No internet
      </AppText>
      <AppText
        size={14}
        color="textMuted"
        align="center"
        style={{ maxWidth: 300 }}
      >
        Check your Wi-Fi or mobile data, then try again. Videos need a
        connection to play.
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
          {checking ? "Checking…" : "Retry"}
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
          Browse offline
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
