import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Series } from "../data/types";
import { useBalance, walletActions } from "../data/wallet";
import { useTheme } from "../hooks/useTheme";
import { withAlpha } from "../utils/color";
import { AppText } from "./AppText";
import { CoinIcon } from "./CoinIcon";

/**
 * Unlock sheet (brief §8): blurred cover, lock, "Unlock episode N — 50 coins", the balance,
 * Unlock (or Get coins when the balance is too low). Unlock takes the coins for real (demo coins),
 * with a coin animation + haptic, then offers "Play episode N".
 */
export function UnlockSheet({
  visible,
  series,
  n,
  price,
  onClose,
  onPlay,
  onGetCoins,
}: {
  visible: boolean;
  series: Series | undefined;
  n: number;
  price: number;
  onClose: () => void;
  onPlay: (n: number) => void;
  onGetCoins: () => void;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const balance = useBalance();
  const [done, setDone] = useState(false);

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
      lock.value = 1;
      float.value = 0;
    }
  }, [visible, n, lock, float]);

  if (!series) return null;
  const enough = balance >= price;
  const missing = Math.max(0, price - balance);

  const unlock = () => {
    const ok = walletActions.unlock(series, n, price);
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
    float.value = 0.001;
    float.value = withDelay(60, withTiming(1, { duration: 900 }));
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
            {done ? `Episode ${n} unlocked` : `Unlock episode ${n}`}
          </AppText>
          <AppText size={13} color="textMuted" align="center" numberOfLines={1}>
            {series.title} · {n} / {series.totalEpisodes}
          </AppText>

          {/* price + balance */}
          <View style={[styles.box, { backgroundColor: colors.surfaceAlt }]}>
            <View style={styles.boxRow}>
              <AppText size={14} color="textMuted">
                {done ? "Paid" : "Price"}
              </AppText>
              <View style={styles.coins}>
                <CoinIcon size={18} glow={false} />
                <AppText weight="bold" size={15} style={{ color: colors.gold }}>
                  {price}
                </AppText>
              </View>
            </View>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <View style={styles.boxRow}>
              <AppText size={14} color="textMuted">
                Your balance
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
              You need {missing} more coins
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
                  Play episode {n}
                </AppText>
              </>
            ) : enough ? (
              <>
                <AppText weight="bold" size={16} color="onPrimary">
                  Unlock
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
                Get coins
              </AppText>
            )}
          </Pressable>

          {!done && enough ? (
            <Pressable onPress={onGetCoins} hitSlop={8} style={styles.link}>
              <AppText weight="medium" size={14} color="textAccent">
                Get more coins
              </AppText>
            </Pressable>
          ) : (
            <Pressable onPress={onClose} hitSlop={8} style={styles.link}>
              <AppText weight="medium" size={14} color="textMuted">
                Close
              </AppText>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
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
});
