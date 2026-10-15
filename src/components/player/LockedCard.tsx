import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { darkColors } from "../../constants/colors";
import type { Series } from "../../data/types";
import { useVip } from "../../data/vip";
import { useBalance } from "../../data/wallet";
import { useT } from "../../i18n";
import { withAlpha } from "../../utils/color";
import { AppText } from "../AppText";
import { CoinIcon } from "../CoinIcon";

/**
 * Page after the last free episode: blurred cover + lock + price + Unlock (→ Unlock sheet).
 * Once unlocked: "Unlocked" + Play (→ "This is a demo" when the episode has no video).
 */
export function LockedCard({
  series,
  n,
  price,
  height,
  unlocked,
  onUnlock,
  onPlay,
  onEpisodes,
}: {
  series: Series;
  n: number;
  price: number;
  height: number;
  unlocked: boolean;
  onUnlock: () => void;
  onPlay: () => void;
  onEpisodes: () => void;
}) {
  const c = darkColors;
  const t = useT();
  const balance = useBalance();
  const vip = !!useVip();
  return (
    <View style={{ height, backgroundColor: c.background }}>
      <Image
        source={{ uri: series.cover }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={34}
      />
      <LinearGradient
        colors={[
          withAlpha(c.background, 0.55),
          withAlpha(c.background, 0.8),
          c.background,
        ]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <View
          style={[styles.cover, { borderColor: unlocked ? c.gold : c.glow }]}
        >
          <Image
            source={{ uri: series.cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={[styles.lockBadge, { backgroundColor: c.overlay }]}>
            <Ionicons
              name={unlocked ? "lock-open" : "lock-closed"}
              size={30}
              color={c.gold}
            />
          </View>
        </View>
        <AppText
          weight="bold"
          size={22}
          color="onPrimary"
          align="center"
          style={{ marginTop: 20 }}
        >
          {unlocked ? t("unlock.doneTitle", { n }) : t("locked.title", { n })}
        </AppText>
        <AppText
          size={14}
          align="center"
          numberOfLines={2}
          style={{ color: c.textMuted }}
        >
          {series.title} · {n} / {series.totalEpisodes}
        </AppText>

        <Pressable
          onPress={unlocked ? onPlay : onUnlock}
          style={({ pressed }) => [
            styles.unlock,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <LinearGradient
            colors={c.gradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          {unlocked ? (
            <>
              <Ionicons name="play" size={18} color={c.onPrimary} />
              <AppText weight="bold" size={16} color="onPrimary">
                {t("unlock.play", { n })}
              </AppText>
            </>
          ) : vip ? (
            <>
              <Ionicons name="diamond" size={16} color={c.onPrimary} />
              <AppText weight="bold" size={16} color="onPrimary">
                {t("unlock.vipBtn")}
              </AppText>
            </>
          ) : (
            <>
              <AppText weight="bold" size={16} color="onPrimary">
                {t("unlock.btn")}
              </AppText>
              <View style={[styles.price, { backgroundColor: c.overlay }]}>
                <CoinIcon size={20} glow={false} />
                <AppText weight="bold" size={16} style={{ color: c.gold }}>
                  {price}
                </AppText>
              </View>
            </>
          )}
        </Pressable>
        <View style={styles.balance}>
          {vip ? (
            <>
              <Ionicons name="diamond" size={13} color={c.gold} />
              <AppText weight="semibold" size={13} style={{ color: c.gold }}>
                VIP
              </AppText>
              <AppText size={13} style={{ color: c.textMuted }}>
                ·
              </AppText>
            </>
          ) : null}
          <AppText size={13} style={{ color: c.textMuted }}>
            {t("locked.balance")}
          </AppText>
          <CoinIcon size={16} glow={false} />
          <AppText weight="semibold" size={13} color="onPrimary">
            {balance}
          </AppText>
        </View>

        <Pressable onPress={onEpisodes} hitSlop={8} style={styles.link}>
          <Ionicons name="albums-outline" size={16} color={c.textAccent} />
          <AppText weight="medium" size={14} style={{ color: c.textAccent }}>
            {t("locked.allEpisodes")}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 4,
  },
  cover: {
    width: 150,
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  unlock: {
    marginTop: 24,
    height: 54,
    alignSelf: "stretch",
    borderRadius: 27,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  price: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  balance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
  },
  link: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18 },
});
