import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Switch, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { settingsActions, useSettings } from "../data/settings";
import type { Series } from "../data/types";
import { useVip } from "../data/vip";
import { useAdsLeft, useBalance, walletActions } from "../data/wallet";
import { useTheme } from "../hooks/useTheme";
import { useT } from "../i18n";
import { withAlpha } from "../utils/color";
import { AdModal } from "./AdModal";
import { AppText } from "./AppText";
import { CoinIcon } from "./CoinIcon";

/**
 * Unlock sheet (brief §8): blurred cover, lock, "Unlock episode N — 50 coins", the balance,
 * Unlock (or Get coins when the balance is too low). Unlock takes the coins for real (demo coins),
 * with a coin animation + haptic, then offers "Play episode N".
 * VIP active → the episode unlocks free (no coins). Not VIP → a link to the VIP page.
 */
export function UnlockSheet({
  visible,
  series,
  n,
  price,
  onClose,
  onPlay,
  onGetCoins,
  onGetVip,
}: {
  visible: boolean;
  series: Series | undefined;
  n: number;
  price: number;
  onClose: () => void;
  onPlay: (n: number) => void;
  onGetCoins: () => void;
  onGetVip: () => void;
}) {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const balance = useBalance();
  const vip = !!useVip();
  const adsLeft = useAdsLeft();
  const { autoUnlock } = useSettings();
  const [done, setDone] = useState(false);
  const [byAd, setByAd] = useState(false);
  const [adOpen, setAdOpen] = useState(false);

  const lock = useSharedValue(1);
  const float = useSharedValue(0);
  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lock.value }],
  }));
  const floatStyle = useAnimatedStyle(() => ({
    opacity: float.value === 0 ? 0 : 1 - float.value,
    transform: [{ translateY: -46 * float.value }],
  }));

  // each time the sheet opens (or another episode) → start again
  useEffect(() => {
    if (visible) {
      setDone(false);
      setByAd(false);
      lock.value = 1;
      float.value = 0;
    }
  }, [visible, n, lock, float]);

  if (!series) return null;
  const enough = vip || balance >= price;
  const missing = Math.max(0, price - balance);

  const onAdReward = () => {
    setAdOpen(false);
    if (!walletActions.unlockWithAd(series, n)) return;
    setByAd(true);
    setDone(true);
    lock.value = withSequence(
      withTiming(0.6, { duration: 90 }),
      withSpring(1, { damping: 7, stiffness: 180 }),
    );
  };

  const unlock = () => {
    const ok = walletActions.unlock(series, n, price, vip);
    if (!ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    setDone(true);
    lock.value = withSequence(
      withTiming(0.6, { duration: 90 }),
      withSpring(1, { damping: 7, stiffness: 180 }),
    );
    if (!vip) {
      float.value = 0.001;
      float.value = withDelay(60, withTiming(1, { duration: 900 }));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 18,
            },
          ]}
        >
          {/* blurred cover at the top, fading into the sheet */}
          <View style={styles.top} pointerEvents="none">
            <Image
              source={{ uri: series.cover }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              blurRadius={30}
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={[
                withAlpha(colors.surface, 0.3),
                withAlpha(colors.surface, 0.75),
                colors.surface,
              ]}
              locations={[0, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View
            style={[
              styles.cover,
              { borderColor: done ? colors.gold : colors.glow },
            ]}
          >
            <Image
              source={{ uri: series.cover }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <Animated.View
              style={[
                styles.lockBadge,
                { backgroundColor: colors.overlay },
                lockStyle,
              ]}
            >
              <Ionicons
                name={done ? "lock-open" : "lock-closed"}
                size={26}
                color={colors.gold}
              />
            </Animated.View>
          </View>

          <AppText
            weight="bold"
            size={20}
            align="center"
            style={{ marginTop: 14 }}
          >
            {done ? t("unlock.doneTitle", { n }) : t("unlock.title", { n })}
          </AppText>
          <AppText size={13} color="textMuted" align="center" numberOfLines={1}>
            {series.title} · {n} / {series.totalEpisodes}
          </AppText>

          {/* price + balance */}
          <View style={[styles.box, { backgroundColor: colors.surfaceAlt }]}>
            <View style={styles.boxRow}>
              <AppText size={14} color="textMuted">
                {done ? t("unlock.paid") : t("unlock.price")}
              </AppText>
              {byAd ? (
                <View style={styles.coins}>
                  <Ionicons name="play-circle" size={16} color={colors.gold} />
                  <AppText
                    weight="bold"
                    size={15}
                    style={{ color: colors.gold }}
                  >
                    {t("ads.freeByAd")}
                  </AppText>
                </View>
              ) : vip ? (
                <View style={styles.coins}>
                  <Ionicons name="diamond" size={15} color={colors.gold} />
                  <AppText
                    weight="bold"
                    size={15}
                    style={{ color: colors.gold }}
                  >
                    {t("unlock.freeVip")}
                  </AppText>
                </View>
              ) : (
                <View style={styles.coins}>
                  <CoinIcon size={18} glow={false} />
                  <AppText
                    weight="bold"
                    size={15}
                    style={{ color: colors.gold }}
                  >
                    {price}
                  </AppText>
                </View>
              )}
            </View>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <View style={styles.boxRow}>
              <AppText size={14} color="textMuted">
                {t("unlock.balance")}
              </AppText>
              <View style={styles.coins}>
                <CoinIcon size={18} glow={false} />
                <AppText weight="bold" size={15}>
                  {balance}
                </AppText>
                <Animated.View
                  style={[styles.float, floatStyle]}
                  pointerEvents="none"
                >
                  <AppText
                    weight="bold"
                    size={15}
                    style={{ color: colors.gold }}
                  >
                    −{price}
                  </AppText>
                </Animated.View>
              </View>
            </View>
          </View>

          {!done && !enough && (
            <AppText
              size={13}
              align="center"
              style={{ color: colors.gold, marginTop: 10 }}
            >
              {t("unlock.needMore", { n: missing })}
            </AppText>
          )}

          <Pressable
            onPress={() => {
              if (done) onPlay(n);
              else if (enough) unlock();
              else onGetCoins();
            }}
            style={({ pressed }) => [
              styles.btn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            {done ? (
              <>
                <Ionicons name="play" size={18} color={colors.onPrimary} />
                <AppText weight="bold" size={16} color="onPrimary">
                  {t("unlock.play", { n })}
                </AppText>
              </>
            ) : vip ? (
              <>
                <Ionicons name="diamond" size={16} color={colors.onPrimary} />
                <AppText weight="bold" size={16} color="onPrimary">
                  {t("unlock.vipBtn")}
                </AppText>
              </>
            ) : enough ? (
              <>
                <AppText weight="bold" size={16} color="onPrimary">
                  {t("unlock.btn")}
                </AppText>
                <View
                  style={[
                    styles.pricePill,
                    { backgroundColor: colors.overlay },
                  ]}
                >
                  <CoinIcon size={18} glow={false} />
                  <AppText
                    weight="bold"
                    size={15}
                    style={{ color: colors.gold }}
                  >
                    {price}
                  </AppText>
                </View>
              </>
            ) : (
              <AppText weight="bold" size={16} color="onPrimary">
                {t("unlock.getCoins")}
              </AppText>
            )}
          </Pressable>

          {/* rewarded ad (demo): unlock free, 3 a day */}
          {!done && !vip ? (
            <Pressable
              disabled={adsLeft <= 0}
              onPress={() => setAdOpen(true)}
              style={({ pressed }) => [
                styles.adBtn,
                {
                  borderColor: colors.gold,
                  backgroundColor: colors.goldSoft,
                  opacity: adsLeft <= 0 ? 0.45 : pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons
                name="play-circle-outline"
                size={18}
                color={colors.gold}
              />
              <AppText
                weight="semibold"
                size={15}
                style={{ color: colors.gold }}
              >
                {adsLeft > 0
                  ? t("ads.watchBtn", { n: adsLeft })
                  : t("ads.noneLeft")}
              </AppText>
            </Pressable>
          ) : null}

          {/* auto-unlock the next episodes (coins or VIP) */}
          {!done ? (
            <View style={[styles.autoRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <AppText weight="medium" size={14}>
                  {t("auto.title")}
                </AppText>
                <AppText size={12} color="textMuted">
                  {vip ? t("auto.hintVip") : t("auto.hint", { n: price })}
                </AppText>
              </View>
              <Switch
                value={autoUnlock}
                onValueChange={(v) => settingsActions.setAutoUnlock(v)}
                trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
                thumbColor={colors.onPrimary}
              />
            </View>
          ) : null}

          {!done && !vip ? (
            <View style={styles.links}>
              {enough ? (
                <Pressable onPress={onGetCoins} hitSlop={8} style={styles.link}>
                  <AppText weight="medium" size={14} color="textAccent">
                    {t("unlock.getMore")}
                  </AppText>
                </Pressable>
              ) : null}
              <Pressable
                onPress={onGetVip}
                hitSlop={8}
                style={[styles.link, styles.vipLink]}
              >
                <Ionicons
                  name="diamond-outline"
                  size={14}
                  color={colors.gold}
                />
                <AppText
                  weight="medium"
                  size={14}
                  style={{ color: colors.gold }}
                >
                  {t("unlock.orVip")}
                </AppText>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={onClose} hitSlop={8} style={styles.link}>
              <AppText weight="medium" size={14} color="textMuted">
                {t("common.close")}
              </AppText>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
      <AdModal
        visible={adOpen}
        onReward={onAdReward}
        onClose={() => setAdOpen(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    overflow: "hidden",
    alignItems: "stretch",
  },
  top: { position: "absolute", top: 0, left: 0, right: 0, height: 170 },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  cover: {
    alignSelf: "center",
    width: 90,
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: 18,
  },
  boxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
  },
  line: { height: StyleSheet.hairlineWidth },
  coins: { flexDirection: "row", alignItems: "center", gap: 6 },
  float: { position: "absolute", right: 0, top: -4 },
  btn: {
    marginTop: 16,
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  link: { alignSelf: "center", paddingVertical: 12 },
  adBtn: {
    marginTop: 10,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  autoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 20,
  },
  vipLink: { flexDirection: "row", alignItems: "center", gap: 6 },
});
