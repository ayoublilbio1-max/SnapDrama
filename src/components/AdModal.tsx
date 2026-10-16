import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEVELOPER, FIVERR_URL } from "../constants/app";
import { darkColors } from "../constants/colors";
import { useT } from "../i18n";
import { AppText } from "./AppText";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO = require("../../assets/images/icon.png"); // the app icon
export const AD_SECONDS = 15;

/**
 * Rewarded ad (DEMO — no ad network): a 15 s full-screen "ad" (it promotes the developer 😉).
 * Watch to the end → onReward(). Closing early → no reward.
 */
export function AdModal({
  visible,
  onReward,
  onClose,
}: {
  visible: boolean;
  onReward: () => void;
  onClose: () => void;
}) {
  const c = darkColors;
  const t = useT();
  const insets = useSafeAreaInsets();
  const [left, setLeft] = useState(AD_SECONDS);
  const rewarded = useRef(false);
  const bar = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({
    width: `${bar.value * 100}%` as const,
  }));

  useEffect(() => {
    if (!visible) return;
    rewarded.current = false;
    setLeft(AD_SECONDS);
    bar.value = 0;
    bar.value = withTiming(1, {
      duration: AD_SECONDS * 1000,
      easing: Easing.linear,
    });
    if (__DEV__) console.log("[ads] demo ad started");
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [visible, bar]);

  useEffect(() => {
    if (visible && left === 0 && !rewarded.current) {
      rewarded.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      if (__DEV__) console.log("[ads] demo ad finished → reward");
    }
  }, [left, visible]);

  const done = left === 0;

  const close = () => {
    if (done) {
      onReward();
      return;
    }
    if (__DEV__) console.log(`[ads] closed early (${left}s left) → no reward`);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <View style={[styles.root, { backgroundColor: c.background }]}>
        <LinearGradient
          colors={[c.primary, c.background]}
          locations={[0, 0.75]}
          style={StyleSheet.absoluteFill}
        />

        {/* top: Ad label · countdown · close */}
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <View style={[styles.adPill, { backgroundColor: c.overlay }]}>
            <AppText weight="bold" size={11} color="onPrimary">
              {t("ads.label")}
            </AppText>
          </View>
          <AppText
            weight="medium"
            size={13}
            color="onPrimary"
            style={{ flex: 1, textAlign: "center" }}
          >
            {done ? t("ads.earned") : t("ads.rewardIn", { n: left })}
          </AppText>
          <Pressable
            onPress={close}
            hitSlop={10}
            style={[styles.close, { backgroundColor: c.overlay }]}
            accessibilityLabel={t("common.close")}
          >
            {done ? (
              <Ionicons name="close" size={20} color={c.onPrimary} />
            ) : (
              <AppText weight="bold" size={13} color="onPrimary">
                {left}
              </AppText>
            )}
          </Pressable>
        </View>

        {/* the "ad" */}
        <View style={styles.center}>
          <Image source={LOGO} style={styles.logo} contentFit="contain" />
          <AppText weight="bold" size={26} color="onPrimary" align="center">
            {t("ads.title")}
          </AppText>
          <AppText
            size={15}
            align="center"
            style={{ color: c.textAccent, maxWidth: 300 }}
          >
            {t("ads.body", { dev: DEVELOPER })}
          </AppText>
          <Pressable
            onPress={() => {
              if (__DEV__) console.log("[ads] ad tapped → Fiverr");
              Linking.openURL(FIVERR_URL).catch(() => {});
            }}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: c.onPrimary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <AppText weight="bold" size={15} style={{ color: c.primary }}>
              {t("ads.cta")}
            </AppText>
          </Pressable>
        </View>

        {/* progress */}
        <View
          style={[
            styles.track,
            { marginBottom: insets.bottom + 24, backgroundColor: c.overlay },
          ]}
        >
          <Animated.View
            style={[styles.fill, { backgroundColor: c.gold }, barStyle]}
          />
        </View>
        <AppText
          size={12}
          align="center"
          style={{
            color: c.textMuted,
            marginBottom: insets.bottom + 16,
            marginTop: -12,
          }}
        >
          {t("ads.demo")}
        </AppText>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  adPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 28,
  },
  logo: { width: 96, height: 96, borderRadius: 22, marginBottom: 6 },
  cta: {
    marginTop: 10,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 24,
    overflow: "hidden",
  },
  fill: { height: 4 },
});
